import { startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { Tables } from "../types";

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

  // Query clinics (no clinic_treatment)
  let clinicQuery = supabaseClient
    .from("clinic")
    .select("*", { count: "exact" })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (filters.region) {
    clinicQuery = clinicQuery.eq("region", filters.region);
  }

  if (filters.clinic_name) {
    clinicQuery = clinicQuery.ilike("clinic_name", `%${filters.clinic_name}%`);
  }

  // Date range filter
  if (filters.date_range?.from && filters.date_range?.to) {
    clinicQuery = clinicQuery.gte(
      "created_at",
      startOfDay(filters.date_range.from).toISOString()
    );
    clinicQuery = clinicQuery.lte("created_at", filters.date_range.to);
  }

  const { data: clinics, error, count } = await clinicQuery;
  if (error) throw error;

  // For each clinic, get all clinic_treatment ids, then get total reviews and average reviews per treatment
  const clinicIds = clinics.map((clinic) => clinic.id);

  // Get all clinic_treatment ids for these clinics
  let clinicTreatments: { clinic_id: string; id: string }[] = [];
  if (clinicIds.length > 0) {
    const { data: ctData, error: ctError } = await supabaseClient
      .from("clinic_treatment")
      .select("id, clinic_id")
      .in("clinic_id", clinicIds);
    if (ctError) throw ctError;
    clinicTreatments = ctData || [];
  }

  // Map clinic_id -> [clinic_treatment_id]
  const clinicTreatmentMap: Record<string, string[]> = {};
  for (const ct of clinicTreatments) {
    if (!clinicTreatmentMap[ct.clinic_id])
      clinicTreatmentMap[ct.clinic_id] = [];
    clinicTreatmentMap[ct.clinic_id].push(ct.id);
  }

  // For each clinic, get total reviews and average reviews per treatment
  const clinicsWithReviewStats = [];
  for (const clinic of clinics) {
    const ctIds = clinicTreatmentMap[clinic.id] || [];
    let totalReviews = 0;
    let avgReviews = 0;
    if (ctIds.length > 0) {
      // Get total reviews for this clinic
      const { count: total, error: reviewError } = await supabaseClient
        .from("review")
        .select("id", { count: "exact", head: true })
        .in("clinic_treatment_id", ctIds)
        .limit(1);
      if (reviewError) throw reviewError;
      totalReviews = total || 0;
      avgReviews = ctIds.length > 0 ? totalReviews / ctIds.length : 0;
    }
    clinicsWithReviewStats.push({
      ...clinic,
      total_reviews: totalReviews,
      avg_reviews_per_treatment: avgReviews,
    });
  }

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
      location: values.location,
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
      location: values.location,
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

export async function fetchClinicDetail(clinic_id: string) {
  const { data, error } = await supabaseClient
    .from("clinic")
    .select(
      `
        *,
        clinic_view(*),
        working_hour(*),
        clinic_treatment (
            id,
            treatment (
                id,
                treatment_name,
                image_url
            ),
            review (
              *,
              user:patient_id(*)
            )
        )
      `
    )
    .eq("id", clinic_id)
    .single();
  if (error) throw error;
  return data;
}
