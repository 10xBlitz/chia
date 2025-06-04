import { endOfDay, startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { Tables } from "../types";

export async function getPaginatedBids(
  page = 1,
  limit = 10,
  filters: Partial<Tables<"bid">> & {
    date_range?: { from?: string; to?: string };
  }
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
    .from("bid")
    .select("*, clinic_treatment(*, clinic(*))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Date range filter
  if (filters.date_range?.from && filters.date_range?.to) {
    query = query.gte("created_at", startOfDay(filters.date_range.from));
    query = query.lte("created_at", endOfDay(filters.date_range.to));
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

export async function getSingleBid(bidId: string) {
  const { data, error } = await supabaseClient
    .from("bid")
    .select("*, clinic_treatment(*, clinic(*), treatment(*))")
    .eq("id", bidId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
