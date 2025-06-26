import { startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { Enums, Tables } from "../types";

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
        treatment (*)
      )
   
    `,
      { count: "exact" }
    )
    .filter("clinic_treatment.status", "not.eq", "deleted")
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
  values: Omit<Tables<"clinic">, "id" | "created_at">,
  pictures: string[]
) {
  const { error } = await supabaseClient
    .from("clinic")
    .update({
      clinic_name: values.clinic_name,
      contact_number: values.contact_number,
      region: values.region,
      opening_date: values.opening_date,
      link: values.link,
      pictures,
    })
    .eq("id", clinicId);
  if (error) throw error;
}

export async function insertClinic(
  values: Omit<Tables<"clinic">, "id" | "created_at">,
  pictures: string[]
) {
  const { data: insertedClinic, error } = await supabaseClient
    .from("clinic")
    .insert({
      clinic_name: values.clinic_name,
      contact_number: values.contact_number,
      region: values.region,
      opening_date: values.opening_date,
      link: values.link,
      pictures,
    })
    .select("id")
    .single();
  if (error) throw error;
  return insertedClinic.id;
}

// Fetch clinic detail (no reviews, no views)
export async function fetchClinicDetail(clinic_id: string) {
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
    .single();
  console.log("---->error", error);
  if (error) throw error;

  console.log("---->error", error);
  return data;
}

// --- Working Hours (Clinic Hours) ---

/**
 * Inserts all working hours for a clinic. Overwrites existing hours if used after deleteClinicWorkingHours.
 * @param clinicId - The clinic ID
 * @param hours - Array of working hour objects
 */
export async function insertClinicWorkingHours(
  clinicId: string,
  hours: Array<{
    day_of_week: Enums<"day_of_week">;
    time_open: string;
    note?: string;
  }>
) {
  if (!clinicId || !Array.isArray(hours)) return;
  if (hours.length === 0) return;
  const { error } = await supabaseClient.from("working_hour").insert(
    hours.map((h) => ({
      clinic_id: clinicId,
      day_of_week: h.day_of_week,
      time_open: h.time_open,
      note: h.note || null,
    }))
  );
  if (error) throw error;
}

/**
 * Deletes all working hours for a clinic. Useful before re-inserting on update.
 * @param clinicId - The clinic ID
 */
export async function deleteClinicWorkingHours(clinicId: string) {
  if (!clinicId) return;
  const { error } = await supabaseClient
    .from("working_hour")
    .delete()
    .eq("clinic_id", clinicId);
  if (error) throw error;
}
