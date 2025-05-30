import { endOfDay, startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { Tables } from "../types";

interface Filters {
  department_name?: string | null;
  date_range?: {
    from?: string;
    to?: string;
  };
}

// CREATE
export async function createClinicDepartment(data: {
  department_name: string;
}) {
  const { data: result, error } = await supabaseClient
    .from("clinic_department")
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
}

// READ (with pagination, filters, ordering)
export async function getClinicDepartments(
  page = 1,
  limit = 10,
  filters: Filters = {},
  order: {
    tableName: keyof Tables<"clinic_department">;
    orderBy: "asc" | "desc";
  } = { tableName: "department_name", orderBy: "asc" }
) {
  if (limit > 1000) throw Error("limit exceeds 1000");
  if (limit < 1) throw Error("limit must be a positive number");

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("clinic_department")
    .select("*", { count: "exact" })
    .order(order.tableName, { [`${order.orderBy}`]: true })
    .range(offset, offset + limit - 1);

  if (filters.department_name) {
    query = query.ilike("department_name", `%${filters.department_name}%`);
  }

  // Date range filter
  if (filters.date_range?.from && filters.date_range?.to) {
    query = query.gte(
      "created_at",
      startOfDay(filters.date_range.from).toISOString()
    );
    query = query.lte(
      "created_at",
      endOfDay(filters.date_range.to).toISOString()
    );
  }

  const { data, error, count } = await query;
  console.log("getPaginatedClinics", data, count);

  if (error) throw error;

  const totalPages = count ? Math.ceil(count / limit) : 1;

  console.log("---->data: ", data);

  return {
    data,
    totalItems: count,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// UPDATE
export async function updateClinicDepartment(
  id: string,
  department_name: string
) {
  const { data, error } = await supabaseClient
    .from("clinic_department")
    .update({ id, department_name })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// DELETE
export async function deleteClinicDepartment(id: string) {
  const { error } = await supabaseClient
    .from("clinic_department")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return { success: true };
}

// CREATE: Insert a new record into the dentist_clinic_department table
export async function insertDentistClinicDepartment(data: {
  dentist_id: string;
  clinic_department_id: string;
}) {
  const { data: result, error } = await supabaseClient
    .from("dentist_clinic_department")
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
}
