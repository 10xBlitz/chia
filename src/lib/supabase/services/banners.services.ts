import { supabaseClient } from "../client";
import { Tables } from "../types";

interface BannerFilters {
  type?: Tables<"banner">["banner_type"];
  // Add more filters as needed, e.g., category, etc.
}

export async function getPaginatedBanners(
  page = 1,
  limit = 10,
  filters: BannerFilters = {}
) {
  // Refresh the session if expired
  const { error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) throw sessionError;

  if (limit > 100) {
    throw Error("Limit exceeds 100");
  }
  if (limit < 1) {
    throw Error("Limit must be a positive number");
  }

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("banner")
    .select("*", { count: "exact" })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  // Date range filter
  if (filters?.type) {
    query = query.eq("banner_type", filters.type);
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
