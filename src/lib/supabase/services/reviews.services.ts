import {
  deleteFileFromSupabase,
  uploadFileToSupabase,
} from "@/lib/supabase/services/upload-file.services";
import { endOfDay, startOfDay } from "date-fns";
import { createClient } from "../client";
import { Database } from "../types";

const supabase = createClient();

type ReviewInsert = Database["public"]["Tables"]["review"]["Insert"];
type ReviewUpdate = Database["public"]["Tables"]["review"]["Update"];

const BUCKET_NAME = "review-images";
const MAX_FILE_SIZE_MB = 50;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Filters {
  full_name?: string | null;
  treatment_id?: number | null;
  patient_id?: string | null;
  clinic_id?: string;
  date_range?: {
    from?: string;
    to?: string;
  };
}

export async function getPaginatedReviews(
  page = 1,
  limit = 10,
  filters: Filters = {}
) {
  if (limit > 1000) throw Error("limit exceeds 1000");
  if (limit < 1) throw Error("limit must be a positive number");

  const offset = (page - 1) * limit;

  let query = (supabase)
    .from("review")
    .select(
      `
      *,
      patient:patient_id!inner( 
          id, 
          full_name, 
          residence, 
          birthdate,
          work_place, 
          contact_number
        ),
        clinic_treatment!inner(
          id,
          status,
          treatment!inner(
            treatment_name,
            status
          ),
          clinic!inner(
            status,
            clinic_name
          )
        )
    `,
      { count: "exact" }
    ) // dot-less select implies INNER JOIN
    .eq("clinic_treatment.clinic.status", "active") // Only show reviews from active clinics
    .eq("clinic_treatment.treatment.status", "active") // Only show reviews for active treatments
    .eq("clinic_treatment.status", "active") // Only show reviews for active clinic treatments
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (filters.full_name) {
    query = query.ilike("patient.full_name", `%${filters.full_name}%`);
  }

  if (filters.clinic_id) {
    query = query.eq("clinic_treatment.clinic_id", filters.clinic_id);
  }

  // Date range filter
  if (filters.date_range?.from && filters.date_range?.to) {
    query = query.gte(
      "created_at",
      startOfDay(filters.date_range.from).toDateString()
    );
    query = query.lte(
      "created_at",
      endOfDay(filters.date_range.to).toDateString()
    );
  }

  if (filters.patient_id) {
    query = query.eq("patient_id", filters.patient_id);
  }

  const { data, error, count } = await query;
  console.log("---->data", data);

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

export async function createReview({
  rating,
  review,
  clinic_treatment_id,
  user_id,
  images = [],
  patient_name,
}: {
  rating: number;
  review?: string;
  clinic_treatment_id: string;
  user_id: string;
  patient_name?: string;
  images?: {
    status: "old" | "new" | "deleted" | "updated";
    file: string | File;
    oldUrl?: string;
  }[];
}) {
  const finalImageUrls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (img.status === "old" && typeof img.file === "string") {
      finalImageUrls.push(img.file);
      continue;
    }

    if (img.status === "new" && img.file instanceof File) {
      const url = await uploadFileToSupabase(img.file, {
        bucket: BUCKET_NAME,
        folder: user_id,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
        maxSizeMB: MAX_FILE_SIZE_MB,
      });
      finalImageUrls.push(url);
      continue;
    }

    if (img.status === "updated" && img.file instanceof File) {
      // No delete needed for create
      const url = await uploadFileToSupabase(img.file, {
        bucket: BUCKET_NAME,
        folder: user_id,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
        maxSizeMB: MAX_FILE_SIZE_MB,
      });
      finalImageUrls.push(url);
      continue;
    }
    // deleted images are not added
  }
  const insertData: ReviewInsert = {
    rating,
    review,
    clinic_treatment_id: clinic_treatment_id,
    images: finalImageUrls,
    patient_id: user_id,
    name: patient_name || null, // Store admin-provided patient name
  };

  const { error: insertError } = await (supabase)
    .from("review")
    .insert(insertData);
  if (insertError) {
    throw new Error(`리뷰 등록 실패: ${insertError.message}`);
  }
  return { success: true };
}

// Infinite fetch reviews for this clinic
export async function fetchClinicReviews({
  pageParam = 0,
  clinic_id,
  pageSize = 10,
}: {
  pageParam?: number;
  pageSize: number;
  clinic_id: string;
}) {
  // Single query: join review -> clinic_treatment, filter by clinic_id
  // Use left join for patient_id since admin-created reviews use admin's user ID
  const { data: reviews, error } = await (supabase)
    .from("review")
    .select(
      "*, user:patient_id(*), clinic_treatment!inner(id, clinic_id, status, treatment!inner(status), clinic!inner(status))"
    )
    .eq("clinic_treatment.clinic_id", clinic_id)
    .eq("clinic_treatment.clinic.status", "active") // Only show reviews from active clinics
    .eq("clinic_treatment.treatment.status", "active") //Only show reviews for active treatments
    .eq("clinic_treatment.status", "active") // Only show reviews for active clinic treatments
    .order("created_at", { ascending: false })
    .range(pageParam * pageSize, pageParam * pageSize + pageSize - 1);

  console.log("---->reviews: ", reviews);

  if (error) throw error;
  return {
    reviews: reviews || [],
    hasMore: (reviews?.length || 0) === pageSize,
  };
}

// Fetch a single review by ID (with treatment info)
export async function fetchReviewById(review_id: string) {
  const { data, error } = await (supabase)
    .from("review")
    .select(
      `*, clinic_treatment:clinic_treatment_id(id, clinic_id, treatment:treatment_id(*))`
    )
    .eq("id", review_id)
    .single();
  if (error) throw error;
  return data;
}

// Update a review
export async function updateReview({
  review_id,
  rating,
  review,
  clinic_treatment_id,
  patient_name,
  images = [],
}: {
  review_id: string;
  rating: number;
  review?: string;
  clinic_treatment_id?: string;
  patient_name?: string;
  images?: {
    status: "old" | "new" | "deleted" | "updated";
    file: string | File;
    oldUrl?: string;
  }[];
}) {
  // 1. Upload/update/delete images and collect their Supabase URLs (preserve order)
  const finalImageUrls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (img.status === "old" && typeof img.file === "string") {
      finalImageUrls.push(img.file);
      continue;
    }

    if (img.status === "new" && img.file instanceof File) {
      const url = await uploadFileToSupabase(img.file, {
        bucket: BUCKET_NAME,
        folder: review_id,
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
      const url = await uploadFileToSupabase(img.file, {
        bucket: BUCKET_NAME,
        folder: review_id,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
        maxSizeMB: MAX_FILE_SIZE_MB,
      });
      finalImageUrls.push(url);
      continue;
    }

    if (
      img.status === "deleted" &&
      typeof img.file === "string" &&
      !img.file.startsWith("data:")
    ) {
      await deleteFileFromSupabase(img.file, { bucket: BUCKET_NAME });
      continue;
    }
  }

  // 3. Save the combined array
  const updateData: ReviewUpdate = {
    rating,
    review,
    clinic_treatment_id,
    name: patient_name || null,
    images: finalImageUrls,
  };

  console.log("Updating review with data:", updateData);
  console.log("Review ID:", review_id);

  const { data, error: updateError } = await (supabase)
    .from("review")
    .update(updateData)
    .eq("id", review_id)
    .select(); // Add select to see what was updated

  console.log("Update result:", { data, error: updateError });

  if (updateError) {
    throw new Error(`리뷰 수정 실패: ${updateError.message}`);
  }

  // Check if any rows were actually updated
  if (!data || data.length === 0) {
    throw new Error("리뷰 수정 권한이 없거나 해당 리뷰를 찾을 수 없습니다. (RLS Policy)");
  }

  return { success: true };
}

/**
 * Delete a review by ID and remove its images from Supabase Storage
 * @param review_id - The review's id (string)
 * @returns {Promise<{ success: boolean }>} Success object
 * @throws Error if deletion fails
 *
 * @example
 * await deleteReview("123");
 */
export async function deleteReview(
  review_id: string
): Promise<{ success: boolean }> {
  // 1. Fetch the review to get its images
  const { data: review, error: fetchError } = await (supabase)
    .from("review")
    .select("images, patient_id")
    .eq("id", review_id)
    .single();
  if (fetchError)
    throw new Error(fetchError.message || "리뷰 조회에 실패했습니다.");

  // 2. Delete the review record
  const { error } = await (supabase)
    .from("review")
    .delete()
    .eq("id", review_id);
  if (error) throw new Error(error.message || "리뷰 삭제에 실패했습니다."); // Failed to delete review

  // 3. Delete all images from Supabase Storage (ignore errors for missing files)
  const reviewData = review as { images?: string[] };
  if (Array.isArray(reviewData?.images) && reviewData.images.length > 0) {
    for (const imageUrl of reviewData.images) {
      try {
        await deleteFileFromSupabase(imageUrl, { bucket: BUCKET_NAME });
      } catch (err) {
        // Ignore individual image delete errors, but log for debugging
        console.warn("Failed to delete review image:", imageUrl, err);
      }
    }
  }
  return { success: true };
}
