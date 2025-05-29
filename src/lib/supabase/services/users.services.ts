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
    query = query.gte(
      "created_at",
      startOfDay(filters.date_range.from).toISOString()
    );
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

// Update user profile fields (except email)
export async function updateUserProfile(
  userId: string,
  values: {
    full_name: string;
    contact_number: string;
    residence: string;
    birthdate: Date;
    gender: string;
    work_place: string;
  }
) {
  // Separate email from other fields
  const { ...profileFields } = values;

  // Update user table (excluding email)
  const { error: profileError } = await supabaseClient
    .from("user")
    .update({
      ...profileFields,
      birthdate: profileFields.birthdate.toDateString(),
    })
    .eq("id", userId);
  if (profileError) throw profileError;
}

// Update user password
export async function updateUserPassword(userId: string, newPassword: string) {
  // This assumes you have a function to update password via Supabase Auth
  const { error } = await supabaseClient.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}
