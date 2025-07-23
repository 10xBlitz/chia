import { supabaseClient } from "@/lib/supabase/client";
import {
  deleteFileFromSupabase,
  uploadFileToSupabase,
} from "@/lib/supabase/services/upload-file.services";
import { endOfDay, startOfDay } from "date-fns";
import { Tables } from "../types";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 10;
const BUCKET_NAME = "quotation-images";

interface CreateQuotationParams {
  treatment_id?: string;
  region: string;
  name: string;
  gender: string;
  birthdate: Date;
  residence: string;
  concern?: string;
  user_id: string;
  clinic_id: string | null;
  images?: File[];
  setUploadingImageIdx?: (idx: number | null) => void;
}

export async function createQuotation({
  region,
  name,
  gender,
  birthdate,
  residence,
  concern,
  user_id,
  clinic_id,
  images = [],
  treatment_id,
  setUploadingImageIdx,
}: CreateQuotationParams) {
  const uploadedImageUrls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    setUploadingImageIdx?.(i); // set current uploading image index
    const file = images[i];
    // Use shared uploadFileToSupabase util
    const publicUrl = await uploadFileToSupabase(file, {
      bucket: BUCKET_NAME,
      folder: user_id,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });
    uploadedImageUrls.push(publicUrl);
  }

  setUploadingImageIdx?.(null); // reset after all uploads

  const { error: insertError } = await supabaseClient.from("quotation").insert([
    {
      region,
      name,
      gender,
      birthdate: birthdate.toISOString(),
      residence,
      concern,
      patient_id: user_id,
      clinic_id,
      image_url: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
      treatment_id,
    },
  ]);

  if (insertError) throw new Error(`견적 등록 실패: ${insertError.message}`);

  console.log("--->insert error: ", insertError);
  return { success: true };
}

export async function getPaginatedQuotations(
  page = 1,
  limit = 10,
  filters: Partial<Tables<"quotation">> & {
    date_range?: { from?: string; to?: string };
  },
  sort?: string
) {
  if (limit > 1000) throw Error("limit exceeds 1000");
  if (limit < 1) throw Error("limit must be a positive number");

  const offset = (page - 1) * limit;

  // Parse sort param (e.g. "created_at:desc")
  let sortField = "created_at";
  let sortDirection = "desc";
  if (sort) {
    const [field, dir] = sort.split(":");
    if (field) sortField = field;
    if (dir) sortDirection = dir;
  }

  // Prepare date filters
  const dateFrom = filters.date_range?.from
    ? startOfDay(filters.date_range.from).toISOString()
    : undefined;
  const dateTo = filters.date_range?.to
    ? endOfDay(filters.date_range.to).toISOString()
    : undefined;

  // Call the RPC function instead of using regular Supabase queries
  // Why RPC? The previous implementation had a critical pagination bug:
  // - We filtered quotations at the JavaScript level AFTER fetching from DB
  // - This caused inaccurate counts (e.g., limit=10 returned only 3 items)
  // - Database returned 10 records, but 7 were filtered out in post-processing
  // - Pagination calculations became wrong, affecting UI and user experience
  //
  // RPC benefits:
  // - All filtering happens at database level for accurate counts
  // - Better performance (less data transferred)
  // - Consistent pagination behavior
  // - Handles complex business logic (soft deletion, clinic-treatment relationships)
  const { data, error } = await supabaseClient.rpc("get_filtered_quotations", {
    page_offset: offset,
    page_limit: limit,
    filter_name: filters.name || undefined,
    filter_status: filters.status || undefined,
    filter_region: filters.region || undefined,
    filter_patient_id: filters.patient_id || undefined,
    filter_date_from: dateFrom,
    filter_date_to: dateTo,
    sort_field: sortField,
    sort_direction: sortDirection,
  });

  console.log("----quotations from RPC: ", data);

  if (error) throw error;

  // Transform the flat RPC result into the expected nested structure
  const transformedData =
    data?.map((row) => ({
      id: row.id,
      region: row.region,
      name: row.name,
      gender: row.gender,
      birthdate: row.birthdate,
      residence: row.residence,
      concern: row.concern,
      patient_id: row.patient_id,
      clinic_id: row.clinic_id,
      treatment_id: row.treatment_id,
      image_url: row.image_url,
      status: row.status,
      created_at: row.created_at,

      // Nested treatment object
      treatment: row.treatment_id
        ? {
            id: row.treatment_id,
            treatment_name: row.treatment_name,
            image_url: row.treatment_image_url,
            status: row.treatment_status,
          }
        : null,

      // Nested clinic object
      clinic: row.clinic_id
        ? {
            clinic_name: row.clinic_name,
            status: row.clinic_status,
          }
        : null,

      // Bid array (simplified - just count for now)
      bid: Array(Number(row.bid_count)).fill({}), // Create array with correct length
    })) || [];

  // Get total count from first row (all rows have same total_count)
  const totalCount = data?.[0]?.total_count || 0;
  const totalPages = Math.ceil(Number(totalCount) / limit);

  return {
    data: transformedData,
    totalItems: Number(totalCount),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function getSingleQuotation(quotationId: string) {
  const { data, error } = await supabaseClient
    .from("quotation")
    .select("*, treatment(*), clinic(clinic_name)")
    .eq("id", quotationId)
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function getSingleQuotationWithPatient(quotationId: string) {
  const { data, error } = await supabaseClient
    .from("quotation")
    .select(
      "*, treatment(*), clinic(clinic_name), patient:user!patient_id(full_name, contact_number)"
    )
    .eq("id", quotationId)
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export interface UpdateQuotationImage {
  status: "old" | "new" | "deleted" | "updated";
  file: string | File;
  oldUrl?: string;
}

export interface UpdateQuotationParams {
  quotation_id: string;
  treatment_id?: string;
  region?: string;
  name?: string;
  gender?: string;
  birthdate?: Date;
  residence?: string;
  concern?: string;
  images?: UpdateQuotationImage[];
  patient_id?: string;
  clinic_id?: string | null;
  setUploadingImageIdx?: (idx: number | null) => void;
}

/**
 * Update a quotation and manage its images in Supabase storage (v3).
 * Handles: deleted, new, old, updated (replace) images, and preserves UI order.
 */
export async function updateQuotation({
  quotation_id,
  treatment_id,
  region,
  name,
  gender,
  birthdate,
  residence,
  concern,
  images = [],
  patient_id,
  clinic_id,
  setUploadingImageIdx,
}: UpdateQuotationParams) {
  // 1. Delete images marked as deleted
  const imagesToDelete = images
    .filter(
      (img) =>
        img.status === "deleted" &&
        typeof img.file === "string" &&
        !img.file.startsWith("data:")
    )
    .map((img) => img.file as string);
  for (const url of imagesToDelete) {
    await deleteFileFromSupabase(url, { bucket: BUCKET_NAME });
  }

  // 2. Upload new images and collect their Supabase URLs (preserve order)
  const finalImageUrls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (img.status === "old" && typeof img.file === "string") {
      finalImageUrls.push(img.file);
      continue;
    }

    if (img.status === "new" && img.file instanceof File) {
      setUploadingImageIdx?.(i);
      const url = await uploadFileToSupabase(img.file, {
        bucket: BUCKET_NAME,
        folder: patient_id,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
        maxSizeMB: MAX_FILE_SIZE_MB,
      });
      finalImageUrls.push(url);
      continue;
    }

    if (img.status === "updated" && img.file instanceof File) {
      if (img.oldUrl) {
        await deleteFileFromSupabase(img.oldUrl, { bucket: BUCKET_NAME });
      }
      setUploadingImageIdx?.(i);
      const url = await uploadFileToSupabase(img.file, {
        bucket: BUCKET_NAME,
        folder: patient_id,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
        maxSizeMB: MAX_FILE_SIZE_MB,
      });
      finalImageUrls.push(url);
      continue;
    }
    // deleted images are not added
  }
  setUploadingImageIdx?.(null);

  const updateObj: Partial<Tables<"quotation">> = {};
  if (treatment_id !== undefined && treatment_id !== "none")
    updateObj.treatment_id = treatment_id;
  if (treatment_id === "none") updateObj.treatment_id = null;
  if (region !== undefined) updateObj.region = region;
  if (name !== undefined) updateObj.name = name;
  if (gender !== undefined) updateObj.gender = gender;
  if (birthdate !== undefined) updateObj.birthdate = birthdate.toISOString();
  if (residence !== undefined) updateObj.residence = residence;
  if (concern !== undefined) updateObj.concern = concern;
  if (clinic_id !== undefined) updateObj.clinic_id = clinic_id;
  updateObj.image_url = finalImageUrls.length > 0 ? finalImageUrls : null;

  const { error: updateError } = await supabaseClient
    .from("quotation")
    .update(updateObj)
    .eq("id", quotation_id);

  if (updateError) throw new Error(`견적 수정 실패: ${updateError.message}`); // Quotation update failed
  return { success: true };
}

// Delete a quotation and its images
export async function deleteQuotation(quotationId: string) {
  /**
   * Delete an array of image URLs from the quotation-images bucket
   */
  async function deleteQuotationImages(urls: string[] = []) {
    for (const url of urls) {
      await deleteFileFromSupabase(url, { bucket: BUCKET_NAME });
    }
  }

  // Fetch the quotation to get image URLs
  const { data, error } = await supabaseClient
    .from("quotation")
    .select("image_url")
    .eq("id", quotationId)
    .single();
  if (error) throw new Error(`견적 조회 실패: ${error.message}`); // Failed to fetch quotation

  // Delete all images from storage if any
  if (Array.isArray(data?.image_url)) {
    await deleteQuotationImages(data.image_url);
  }

  // Delete the quotation row
  const { error: deleteError } = await supabaseClient
    .from("quotation")
    .delete()
    .eq("id", quotationId);
  if (deleteError) throw new Error(`견적 삭제 실패: ${deleteError.message}`); // Quotation delete failed
  return { success: true };
}
