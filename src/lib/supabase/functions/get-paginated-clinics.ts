import { supabaseClient } from "../client";

interface Filters {
  clinic_name?: string | null;
  treatment_id?: number | null;
  created_at?: string | null; // ISO date string
}

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
    .select(`
      id,
      clinic_name,
      location,
      contact_number,
      link,
      pictures,
      region,
      views,
      clinic_treatment (
        treatment (
          id,
          treatment_name,
          image_url
        )
      )
    `, { count: "exact" }) // dot-less select implies INNER JOIN
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  // Filters
  if (filters.treatment_id) {
    query = query.eq("treatment_id", filters.treatment_id);
  }

  if (filters.clinic_name) {
    query = query.ilike("clinic.clinic_name", `%${filters.clinic_name}%`);
  }

  if (filters.created_at) {
    query = query.eq("created_at", filters.created_at);
  }

  const { data, error, count } = await query;
  console.log("getPaginatedClinics", data,);

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
