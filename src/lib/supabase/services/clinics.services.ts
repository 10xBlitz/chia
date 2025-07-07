import { startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { TablesInsert, TablesUpdate } from "../types";
import { fetchClinicWorkingHours } from "@/lib/supabase/services/working-hour.services";
import { Constants } from "@/lib/supabase/types";

interface Filters {
  clinic_name?: string | null;
  treatment_id?: number | null;
  region?: string | null;
  date_range?: {
    from?: string;
    to?: string;
  };
}

export const CLINIC_IMAGE_BUCKET = "clinic-images";
export const CLINIC_IMAGE_MAX_FILE_SIZE_MB = 50 * 1024 * 1024; // 50 MB
export const CLINIC_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function getPaginatedClinics(
  page = 1,
  limit = 10,
  filters: Filters = {}
) {
  if (limit > 1000) throw Error("limit exceeds 1000");
  if (limit < 1) throw Error("limit must be a positive number");

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("clinic")
    .select(
      `
     *, 
     clinic_view(*),
     working_hour(*),
     clinic_treatment (
        *,
        treatment!inner (*)
      )
   
    `,
      { count: "exact" }
    )
    .filter("clinic_treatment.status", "not.eq", "deleted")
    .filter("status", "not.eq", "deleted") // Only show active clinics
    .order("clinic_name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (filters.clinic_name) {
    query = query.ilike("clinic_name", `%${filters.clinic_name}%`);
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

/**
 * Fetches paginated clinics and, for each clinic, calculates the total number of reviews
 * and the average number of reviews per treatment.
 *
 * This function performs two separate requests to Supabase:
 * 1. The first request fetches the paginated clinics.
 * 2. The second request fetches all clinic_treatment IDs for the clinics in the current page,
 *    and then for each clinic, counts the total reviews and computes the average per treatment.
 *
 * Separate requests are used because Supabase/PostgREST does not support aggregate functions
 * (like COUNT or AVG) across nested relationships in a single query. By splitting the logic,
 * we avoid querying all rows for reviews and keep the code efficient and maintainable.
 *
 * @param page - The page number (default: 1)
 * @param limit - The number of items per page (default: 10)
 * @param filters - Optional filters for clinics (region, clinic_name, date_range)
 * @returns Paginated clinics with total_reviews and avg_reviews_per_treatment for each clinic
 */
export async function getPaginatedClinicsWthReviews(
  page = 1,
  limit = 10,
  filters: Filters = {}
) {
  if (limit > 1000) throw Error("limit exceeds 1000");
  if (limit < 1) throw Error("limit must be a positive number");

  const offset = (page - 1) * limit;

  // Use a single query with aggregate for review count per clinic and average per treatment
  let query = supabaseClient
    .from("clinic")
    .select(
      `
        *,
        clinic_treatment (
          *,
          total_reviews:review(count),
          avg_reviews_per_treatment:review(avg:rating)
        )
      `,
      { count: "exact" }
    )
    .filter("status", "not.eq", "deleted") // Only show active clinics
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (filters.region) {
    query = query.eq("region", filters.region);
  }
  if (filters.clinic_name) {
    query = query.ilike("clinic_name", `%${filters.clinic_name}%`);
  }
  if (filters.date_range?.from && filters.date_range?.to) {
    query = query.gte(
      "created_at",
      startOfDay(filters.date_range.from).toISOString()
    );
    query = query.lte("created_at", filters.date_range.to);
  }

  const { data: clinics, error, count } = await query;
  if (error) throw error;

  // Calculate total_reviews and avg_reviews_per_treatment for each clinic from the nested aggregates
  const clinicsWithReviewStats = (clinics || []).map((clinic) => {
    const treatments = clinic.clinic_treatment || [];
    const total_reviews = treatments.reduce(
      (sum, t) => sum + Number(t.total_reviews?.[0]?.count || 0),
      0
    );
    const avg_reviews_per_treatment =
      treatments.length > 0
        ? treatments.reduce(
            (sum, t) =>
              sum + Number(t.avg_reviews_per_treatment?.[0]?.avg || 0),
            0
          ) / treatments.length
        : 0;
    return {
      ...clinic,
      total_reviews,
      avg_reviews_per_treatment,
    };
  });

  const totalPages = count ? Math.ceil(count / limit) : 1;

  return {
    data: clinicsWithReviewStats,
    totalItems: count,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function updateClinic(
  clinicId: string,
  values: TablesUpdate<"clinic">,
  pictures: string[]
) {
  const { error } = await supabaseClient
    .from("clinic")
    .update({
      clinic_name: values.clinic_name,
      contact_number: values.contact_number,
      full_address: values.full_address,
      detail_address: values.detail_address || null,
      city: values.city,
      region: values.region,
      opening_date: values.opening_date,
      link: values.link,
      introduction: values.introduction || null,
      pictures,
    })
    .eq("id", clinicId);
  if (error) throw error;
}

export async function insertClinic(
  values: TablesInsert<"clinic">,
  pictures: string[]
) {
  const { data: insertedClinic, error } = await supabaseClient
    .from("clinic")
    .insert({
      clinic_name: values.clinic_name,
      contact_number: values.contact_number,
      detail_address: values.detail_address || null,
      city: values.city,
      region: values.region,
      full_address: values.full_address,
      opening_date: values.opening_date,
      link: values.link,
      introduction: values.introduction || null,
      pictures,
    })
    .select("id")
    .single();
  if (error) throw error;
  return insertedClinic.id;
}

export async function getClinic(clinic_id: string) {
  const { data, error } = await supabaseClient
    .from("clinic")
    .select(
      `
        *,
        working_hour(*),
        clinic_treatment (
          id,
          treatment (
            id,
            treatment_name,
            image_url
          )
        )
      `
    )
    .eq("id", clinic_id)
    .filter("status", "not.eq", "deleted") // Only get active clinics
    .filter("clinic_treatment.status", "not.eq", "deleted")
    .single();
  console.log("---->error", error);
  if (error) throw error;

  console.log("---->error", error);
  return data;
}

/**
 * Soft delete a clinic by setting a status or adding a deleted flag
 * Since the schema might not have a deleted_at column, we'll use an approach
 * that marks the clinic as inactive or deleted without removing the data
 */
export async function softDeleteClinic(clinicId: string) {
  // Option 1: If there's a status field, set it to 'deleted' or 'inactive'
  // Option 2: If there's no status field, we could add a custom field
  // For now, let's try to update with a status approach

  const { error } = await supabaseClient
    .from("clinic")
    .update({
      // Assuming we add a status field or use an existing one
      // This might need to be adjusted based on the actual schema
      status: "deleted",
    })
    .eq("id", clinicId);

  if (error) {
    // If status field doesn't exist, we'll fall back to hard delete
    // but ideally the database should be modified to support soft delete
    console.warn("Soft delete failed, status field might not exist:", error);
    throw new Error(
      "소프트 삭제를 지원하지 않습니다. 데이터베이스 스키마를 확인하세요."
    ); // Soft delete not supported. Please check database schema.
  }
}

/**
 * Hard delete a clinic (permanent deletion)
 * Use this only when soft delete is not available
 */
export async function hardDeleteClinic(clinicId: string) {
  const { error } = await supabaseClient
    .from("clinic")
    .delete()
    .eq("id", clinicId);

  if (error) throw error;
}

/**
 * Returns an array of weekday numbers (0=Sunday, 1=Monday, ...) that are NOT present in the clinic's working hours.
 * @param clinic_id Clinic ID
 */
export async function getDisabledWeekdaysForClinic(
  clinic_id: string
): Promise<number[]> {
  // Fetch all working hours for the clinic
  const allWorkingHours = await fetchClinicWorkingHours(clinic_id);
  // All possible weekdays in Korean
  const allWeekdays = Constants.public.Enums.day_of_week.slice(0, 7); // Exclude 점심시간
  // Find which weekdays are present in working hours
  const openDays = new Set((allWorkingHours || []).map((wh) => wh.day_of_week));
  // Return weekday numbers that are NOT present in openDays
  return allWeekdays
    .map((day, idx) => (openDays.has(day) ? null : idx))
    .filter((v) => v !== null) as number[];
}
