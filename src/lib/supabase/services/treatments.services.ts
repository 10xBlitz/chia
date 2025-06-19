import { supabaseClient } from "../client";
import { uploadFileToSupabase } from "./upload-file.services";

interface TreatmentFilters {
  treatment_name?: string;
  clinic_id?: string;
}

const IMAGE_BUCKET = "treatment-images";
const MAX_FILE_SIZE_MB = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function getPaginatedTreatments(
  page = 1,
  limit = 10,
  filters: TreatmentFilters = {}
) {
  if (limit > 1000) {
    throw Error("Limit exceeds 100");
  }
  if (limit < 1) {
    throw Error("Limit must be a positive number");
  }

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("treatment")
    .select("*", { count: "exact" })
    .not("status", "eq", "deleted") // Assuming you want to exclude deleted treatments
    .order("treatment_name", { ascending: true })
    .range(offset, offset + limit - 1);

  // Filters
  if (filters.treatment_name) {
    query = query.ilike("treatment_name", `%${filters.treatment_name}%`);
  }
  // Add more filters here as needed

  const { data, error, count } = await query;

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

export async function getPaginatedClinicTreatments(
  clinic_id: string,
  page = 1,
  limit = 10,
  filters: TreatmentFilters = {}
) {
  if (limit > 1000) {
    throw Error("Limit exceeds 100");
  }
  if (limit < 1) {
    throw Error("Limit must be a positive number");
  }

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("clinic_treatment")
    .select("*, treatment(*)", { count: "exact" })
    .eq("clinic_id", clinic_id)
    .eq("status", "active") // Assuming you want to include only active treatments
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  // Filters
  if (filters?.treatment_name) {
    query = query.ilike("treatment_name", `%${filters.treatment_name}%`);
  }
  // Add more filters here as needed

  const { data, error, count } = await query;

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

export async function removeTreatmentImage(imageUrl: string) {
  const path = imageUrl.split("treatment-images/")[1];
  const { error } = await supabaseClient.storage
    .from(IMAGE_BUCKET)
    .remove([path]);
  if (error) throw error;
}

/**
 * Inserts a new treatment into the database, uploading the image if provided as File.
 * @param treatment - Object containing treatment_name and optional image_url (File or string).
 * @returns The inserted treatment data.
 * @example
 * await insertTreatment({ treatment_name: "Whitening", image_url: File });
 */
export async function insertTreatment(
  treatment: {
    treatment_name: string;
    image_url?: string | File;
  },
  progress?: (prog: string | null) => void
) {
  let imageUrl: string | undefined = undefined;
  if (treatment.image_url && treatment.image_url instanceof File) {
    progress?.("이미지 업로드 중..."); // "Uploading image..."
    console.log("-----> uploading file to supabase from insert treatment");
    imageUrl = await uploadFileToSupabase(treatment.image_url, {
      bucket: IMAGE_BUCKET,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      maxSizeMB: MAX_FILE_SIZE_MB / 1024 / 1024, // Convert MB to bytes
    });
  } else if (typeof treatment.image_url === "string") {
    imageUrl = treatment.image_url;
  }
  progress?.("트리트먼트 추가 중..."); // "Adding treatment..."
  const { data, error } = await supabaseClient
    .from("treatment")
    .insert([{ treatment_name: treatment.treatment_name, image_url: imageUrl }])
    .select()
    .single();
  progress?.(null);

  if (error) throw error;
  return data;
}

/**
 * Updates an existing treatment in the database, replacing the image if a new File is provided.
 * Removes the old image from storage if replaced.
 * @param id - The treatment's ID.
 * @param updates - Object containing fields to update (treatment_name, image_url as string or File).
 * @returns The updated treatment data.
 * @example
 * await updateTreatment("123", { treatment_name: "Updated Name", image_url: File });
 */
export async function updateTreatment(
  id: string,
  updates: { treatment_name?: string; image_url?: string | File }
) {
  let imageUrl: string | undefined = undefined;
  let removeOldImage = false;
  let oldImageUrl: string | undefined | null = undefined;

  if (updates.image_url && updates.image_url instanceof File) {
    // Get old image_url from DB
    const { error, data: old } = await supabaseClient
      .from("treatment")
      .select("image_url")
      .eq("id", id)
      .single();
    if (error) throw error;
    oldImageUrl = old?.image_url;
    imageUrl = await uploadFileToSupabase(updates.image_url, {
      bucket: IMAGE_BUCKET,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      maxSizeMB: MAX_FILE_SIZE_MB / 1024 / 1024, // Convert MB to bytes
    });
    removeOldImage = !!oldImageUrl;
  } else if (typeof updates.image_url === "string") {
    imageUrl = updates.image_url;
  }

  const { data, error } = await supabaseClient
    .from("treatment")
    .update({
      ...(updates.treatment_name && { treatment_name: updates.treatment_name }),
      ...(imageUrl && { image_url: imageUrl }),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  if (removeOldImage && oldImageUrl && imageUrl !== oldImageUrl) {
    await removeTreatmentImage(oldImageUrl);
  }

  return data;
}
