import { startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { Tables } from "../types";

export async function getPaginatedFavoriteClinics(
  page = 1,
  limit = 10,
  filters: Partial<
    Tables<"clinic"> & {
      user_id: string;
      date_range?: {
        from?: string;
        to?: string;
      };
    }
  >
) {
  if (limit > 1000) throw Error("limit exceeds 1000");
  if (limit < 1) throw Error("limit must be a positive number");

  const offset = (page - 1) * limit;

  // Query clinics (no clinic_treatment)
  let favoriteClinicsQuery = supabaseClient
    .from("favorite_clinic")
    .select("*, clinic!inner(*)", { count: "exact" })
    .filter("clinic.status", "neq", "deleted")
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (filters.user_id) {
    favoriteClinicsQuery = favoriteClinicsQuery.filter(
      "patient_id",
      "eq",
      filters.user_id
    );
  }

  if (filters.region) {
    favoriteClinicsQuery = favoriteClinicsQuery.eq("region", filters.region);
  }

  if (filters.clinic_name) {
    favoriteClinicsQuery = favoriteClinicsQuery.ilike(
      "clinic_name",
      `%${filters.clinic_name}%`
    );
  }

  // Date range filter
  if (filters.date_range?.from && filters.date_range?.to) {
    favoriteClinicsQuery = favoriteClinicsQuery.gte(
      "created_at",
      startOfDay(filters.date_range.from).toISOString()
    );
    favoriteClinicsQuery = favoriteClinicsQuery.lte(
      "created_at",
      filters.date_range.to
    );
  }

  const { data: favoriteClinics, error, count } = await favoriteClinicsQuery;
  if (error) throw error;

  const clinics = favoriteClinics.map((item) => ({
    clinic_name: item.clinic.clinic_name,
    clinic_id: item.clinic.id,
    introduction: item.clinic.introduction || null,
    contact_number: item.clinic.contact_number,
    created_at: item.clinic.created_at,
    id: item.id,
    link: item.clinic.link,
    opening_date: item.clinic.opening_date,
    pictures: item.clinic.pictures,
    full_address: item.clinic.full_address,
    detail_address: item.clinic.detail_address || null,
    city: item.clinic.city,
    status: item.clinic.status,
    region: item.clinic.region,
  }));

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
