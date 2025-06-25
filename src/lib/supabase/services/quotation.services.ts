import { supabaseClient } from "@/lib/supabase/client";
import { Tables } from "../types";
import { endOfDay, startOfDay } from "date-fns";
import {
  uploadFileToSupabase,
  deleteFileFromSupabase,
} from "@/lib/supabase/services/upload-file.services";

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
  }
) {
  if (limit > 1000) throw Error("limit exceeds 1000");
  if (limit < 1) throw Error("limit must be a positive number");

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("quotation")
    .select("*, treatment(*), bid(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.patient_id) {
    query = query.eq("patient_id", filters.patient_id);
  }

  // Date range filter
  if (filters.date_range?.from && filters.date_range?.to) {
    query = query.gte(
      "created_at",
      startOfDay(filters.date_range.from).toISOString()
    );
    query = query.lte("created_at", endOfDay(filters.date_range.to));
  }

  const { data, error, count } = await query;
  console.log("getPaginatedClinics", data, count);

  if (error) throw error;

  const totalPages = count ? Math.ceil(count / limit) : 1;

  return {
    data,
    totalItems: count,
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

interface UpdateQuotationImage {
  url: string;
  file?: File;
  status: "old" | "new" | "deleted";
}

interface UpdateQuotationParams {
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
 * Update a quotation and manage its images in Supabase storage.
 *
 * This function handles all logic for:
 *   - Deleting images marked as deleted (status: "deleted")
 *   - Uploading new images (status: "new" with a File)
 *   - Retaining old images (status: "old")
 *   - Saving the final array of image URLs to the DB
 *
 * @param {Object} params - Update params
 * @param {string} params.quotation_id - The quotation ID to update
 * @param {string} [params.treatment_id] - Treatment ID (optional)
 * @param {string} [params.region] - Region (optional)
 * @param {string} [params.name] - Name (optional)
 * @param {string} [params.gender] - Gender (optional)
 * @param {Date}   [params.birthdate] - Birthdate (optional)
 * @param {string} [params.residence] - Residence (optional)
 * @param {string} [params.concern] - Concern (optional)
 * @param {UpdateQuotationImage[]} [params.images] - Array of image objects. Each image must have:
 *   - url: string (required, can be a Supabase URL or data URL)
 *   - file?: File (required for new images, optional otherwise)
 *   - status: "old" | "new" | "deleted"
 *     - "old": existing image to keep
 *     - "new": new image to upload
 *     - "deleted": image to delete from storage
 * @param {string} [params.patient_id] - Patient ID (for folder path)
 * @param {string|null} [params.clinic_id] - Clinic ID (optional)
 * @param {(idx: number | null) => void} [params.setUploadingImageIdx] - Callback for upload progress (optional)
 *
 * @returns {Promise<{ success: true }>} Resolves on success, throws on error
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
  // 1. Find removed image URLs (old images marked as deleted)
  const imagesToDelete = images
    .filter((img) => img.status === "deleted" && !img.url.startsWith("data:"))
    .map((img) => img.url);

  for (const url of imagesToDelete) {
    await deleteFileFromSupabase(url, { bucket: BUCKET_NAME });
  }

  // 2. Upload new images and collect their Supabase URLs
  const uploadedUrls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (img.status === "new" && img.file) {
      setUploadingImageIdx?.(i);
      const url = await uploadFileToSupabase(img.file, {
        bucket: BUCKET_NAME,
        folder: patient_id,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
        maxSizeMB: MAX_FILE_SIZE_MB,
      });
      uploadedUrls.push(url);
    }
  }
  setUploadingImageIdx?.(null);

  // 3. Only keep Supabase URLs for old images not deleted
  const existingImageUrls = images
    .filter((img) => img.status === "old")
    .map((img) => img.url);

  // 4. Save the combined array
  const allImageUrls = [...existingImageUrls, ...uploadedUrls];

  const updateObj: Partial<Tables<"quotation">> = {};
  if (treatment_id !== undefined && treatment_id !== "none")
    updateObj.treatment_id = treatment_id;
  if (treatment_id === "none") {
    updateObj.treatment_id = null; // Set to null if 'none' is selected
  }
  if (region !== undefined) updateObj.region = region;
  if (name !== undefined) updateObj.name = name;
  if (gender !== undefined) updateObj.gender = gender;
  if (birthdate !== undefined) updateObj.birthdate = birthdate.toISOString();
  if (residence !== undefined) updateObj.residence = residence;
  if (concern !== undefined) updateObj.concern = concern;
  if (clinic_id !== undefined) updateObj.clinic_id = clinic_id;
  updateObj.image_url = allImageUrls.length > 0 ? allImageUrls : null;

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
