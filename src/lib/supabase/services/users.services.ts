import { useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "../client";
import { startOfDay } from "date-fns";

interface Filters {
  full_name?: string | null;
  category?: "patient" | "dentist" | "admin" | "dentist employee";
  date_range?: {
    from?: string;
    to?: string;
  };
}

export async function getPaginatedUsers(
  page = 1,
  limit = 10,
  filters: Filters = {}
) {
  console.log("---->getPaginatedUsers", { page, limit, filters });

  if (limit > 1000) {
    throw Error("limit exceeds 1000");
  }

  if (limit < 1) {
    throw Error("limit must be a positive number");
  }

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("user")
    .select("*", { count: "exact" })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  // Filters
  if (filters.full_name) {
    query = query.ilike("full_name", `%${filters.full_name}%`);
  }

  if (filters.category) {
    query = query.eq("role", filters.category);
  }

  
  // Date range filter
  if (filters.date_range?.from && filters.date_range?.to) {
    query = query.gte("created_at", (startOfDay(filters.date_range.from)).toISOString());
    query = query.lte("created_at", filters.date_range.to);
  
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
