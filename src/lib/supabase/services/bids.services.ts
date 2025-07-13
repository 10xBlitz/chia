import { endOfDay, startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { Tables, TablesInsert } from "../types";

export async function getPaginatedBids(
  page = 1,
  limit = 10,
  filters: Partial<Tables<"bid">> & {
    date_range?: { from?: string; to?: string };
  } = {},
  orderBy: keyof Tables<"bid"> = "created_at",
  orderDirection: "asc" | "desc" = "desc"
) {
  if (limit > 100) {
    throw Error("Limit exceeds 100");
  }
  if (limit < 1) {
    throw Error("Limit must be a positive number");
  }
  if (page < 1) {
    throw Error("Page must be a positive number");
  }

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("bid")
    .select("*, clinic_treatment(*, clinic(*))", { count: "exact" })
    .filter("clinic_treatment.clinic.status", "neq", "deleted")
    .order(orderBy, { ascending: orderDirection === "asc" })
    .range(offset, offset + limit - 1);

  // Date range filter
  if (filters.date_range?.from) {
    query = query.gte("created_at", startOfDay(filters.date_range.from));
  }
  if (filters.date_range?.to) {
    query = query.lte("created_at", endOfDay(filters.date_range.to));
  }

  // Dynamically add filters for all bid columns
  const bidColumns: (keyof Tables<"bid">)[] = [
    "id",
    "clinic_treatment_id",
    "quotation_id",
    "expected_price_min",
    "expected_price_max",
    "recommend_quick_visit",
    "status",
  ];
  for (const key of bidColumns) {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== "") {
      query = query.eq(key as string, value);
    }
  }

  // Add more dynamic filters if needed (e.g., partial match for explanation)
  if (filters.additional_explanation) {
    query = query.ilike(
      "additional_explanation",
      `%${filters.additional_explanation}%`
    );
  }

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

export async function insertBid(values: TablesInsert<"bid">) {
  const { error: insertError, data } = await supabaseClient
    .from("bid")
    .insert(values)
    .select()
    .single();

  if (insertError) {
    console.error("Insert bid error:", insertError);
    throw new Error("등록에 실패했습니다. 다시 시도해주세요."); // Registration failed. Please try again.
  }

  return data;
}

export async function getSingleBid(bidId: string) {
  const { data, error } = await supabaseClient
    .from("bid")
    .select("*, clinic_treatment(*, clinic(*), treatment(*))")
    .filter("clinic_treatment.clinic.status", "neq", "deleted")
    .eq("id", bidId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getClinicBidOnQuotation(
  quotationId: string,
  clinicId: string
) {
  if (!clinicId) return null;
  const { data: bid, error: bidError } = await supabaseClient
    .from("bid")
    .select("*, clinic_treatment(*)")
    .filter("clinic_treatment.clinic.status", "neq", "deleted")
    .eq("quotation_id", quotationId)
    .eq("clinic_treatment.clinic_id", clinicId)
    .single();
  if (bidError || !bid) return null;
  return bid;
}
