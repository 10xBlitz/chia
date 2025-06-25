import { endOfDay, startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { v4 as uuidv4 } from "uuid";

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

  let query = supabaseClient
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
        clinic_treatment(
          id,
          treatment(
            treatment_name
          ),
          clinic(
            clinic_name
          )
        )
    `,
      { count: "exact" }
    ) // dot-less select implies INNER JOIN
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  // Filters
  // if (filters.treatment_id) {
  //   query = query.eq("clinic_treatment.treatment_id", filters.treatment_id);
  // }

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
  console.log("paginatedREviews", data, count, filters);

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

export type CreateReviewParams = {
  rating: number;
  review?: string;
  clinic_treatment_id: string;
  user_id: string;
  images?: File[];
};

export async function createReview({
  rating,
  review,
  clinic_treatment_id,
  user_id,
  images = [],
}: CreateReviewParams) {
  const uploadedImageUrls: string[] = [];
  console.log("createReview", {
    rating,
    review,
    clinic_treatment_id,
    user_id,
    images: images.map((img) => img.name),
  });

  for (const file of images) {
    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`지원하지 않는 이미지 형식입니다: ${file.type}`);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`이미지 크기는 ${MAX_FILE_SIZE_MB}MB 이하만 허용됩니다.`);
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user_id}/${fileName}`;

    const { error: uploadError } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
      throw new Error("이미지 URL 생성 실패");
    }

    uploadedImageUrls.push(publicUrlData.publicUrl);
  }

  const { error: insertError } = await supabaseClient.from("review").insert({
    rating,
    review,
    clinic_treatment_id: clinic_treatment_id,
    images: uploadedImageUrls,
    patient_id: user_id,
  });

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
  const { data: reviews, error } = await supabaseClient
    .from("review")
    .select("*, user:patient_id(*), clinic_treatment!inner(id, clinic_id)")
    .eq("clinic_treatment.clinic_id", clinic_id)
    .order("created_at", { ascending: false })
    .range(pageParam * pageSize, pageParam * pageSize + pageSize - 1);

  if (error) throw error;
  return {
    reviews: reviews || [],
    hasMore: (reviews?.length || 0) === pageSize,
  };
}

// Fetch a single review by ID (with treatment info)
export async function fetchReviewById(review_id: string) {
  const { data, error } = await supabaseClient
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
  images = [],
}: {
  review_id: string;
  rating: number;
  review?: string;
  clinic_treatment_id?: string;
  images?: string[];
}) {
  // No upload logic needed, just update the images array in the DB
  const { error: updateError } = await supabaseClient
    .from("review")
    .update({
      rating,
      review,
      clinic_treatment_id,
      images,
    })
    .eq("id", review_id);
  if (updateError) {
    throw new Error(`리뷰 수정 실패: ${updateError.message}`);
  }
  return { success: true };
}

/**
 * Delete a review by ID
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
  const { error } = await supabaseClient
    .from("review")
    .delete()
    .eq("id", review_id);
  if (error) throw new Error(error.message || "리뷰 삭제에 실패했습니다."); // Failed to delete review
  return { success: true };
}
