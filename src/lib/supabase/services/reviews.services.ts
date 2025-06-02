import { startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = "review-images";
const MAX_FILE_SIZE_MB = 50;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Filters {
  full_name?: string | null;
  treatment_id?: number | null;
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
      id,
      rating,
      review,
      patient:patient_id ( 
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
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  // Filters
  // if (filters.treatment_id) {
  //   query = query.eq("clinic_treatment.treatment_id", filters.treatment_id);
  // }

  if (filters.full_name) {
    query = query.ilike(
      "reservation.patient.full_name",
      `%${filters.full_name}%`
    );
    query = query.not("reservation", "is", null);
    query = query.not("reservation.patient", "is", null);
  }

  // Date range filter
  if (filters.date_range?.from && filters.date_range?.to) {
    query = query.gte(
      "created_at",
      startOfDay(filters.date_range.from).toISOString()
    );
    query = query.lte("created_at", filters.date_range.to);
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

/**
 * Fetch all reviews for a clinic, including review images and patient info.
 * @param clinicId The clinic id
 */
export async function getClinicReviews(clinicId: string) {
  // Fetch all reviews where the related clinic_treatment.clinic_id matches
  const { data: reviews, error: reviewsError } = await supabaseClient
    .from("review")
    .select(
      `
        *,
        user:patient_id (
          id,
          full_name
        ),
        clinic_treatment (
          id,
          clinic_id
        )
      `
    )
    .eq("clinic_treatment.clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (reviewsError) throw reviewsError;

  // Fetch clinic views count only
  const { count: viewsCount, error: clinicError } = await supabaseClient
    .from("clinic_view")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  if (clinicError) throw clinicError;

  return {
    reviews: reviews || [],
    views: viewsCount ?? 0,
  };
}
