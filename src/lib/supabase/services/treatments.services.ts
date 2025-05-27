import { supabaseClient } from "../client";

interface TreatmentFilters {
  treatment_name?: string;
  // Add more filters as needed, e.g., category, etc.
}

export async function getPaginatedTreatments(
  page = 1,
  limit = 10,
  filters: TreatmentFilters = {}
) {
  if (limit > 100) {
    throw Error("Limit exceeds 100");
  }
  if (limit < 1) {
    throw Error("Limit must be a positive number");
  }

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("treatment")
    .select("id, treatment_name, image_url", { count: "exact" })
    .order("id", { ascending: true })
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
  if (limit > 100) {
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
    .order("id", { ascending: true })
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
