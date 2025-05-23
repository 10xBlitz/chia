import { startOfDay } from "date-fns";
import { supabaseClient } from "../client";

interface BannerFilters {
 date_range?: {
    from?: string;
    to?: string;
  };
  // Add more filters as needed, e.g., category, etc.
}

export async function getPaginatedBanners(
  page = 1,
  limit = 10,
  filters: BannerFilters = {}
) {
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
  if (filters.date_range?.from && filters.date_range?.to) {
    query = query.gte("created_at", (startOfDay(filters.date_range.from)).toISOString());
    query = query.lte("created_at", filters.date_range.to);
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