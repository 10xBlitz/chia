// ...existing code...

import { supabaseClient } from "../client";
import { Enums } from "../types";

export type WorkingHourFilters = {
  dayOfWeek?: Enums<"day_of_week">;
};

/**
 * Fetch working hours for a clinic, optionally filtered by any field
 * @param clinic_id Clinic ID
 * @param filters Optional filter object (e.g., { dayOfWeek: "월요일", id: "..." })
 * @returns Array of working hour rows for the clinic
 */
export async function fetchClinicWorkingHours(
  clinic_id: string,
  filters: WorkingHourFilters = {}
) {
  let query = supabaseClient
    .from("working_hour")
    .select("*")
    .eq("clinic_id", clinic_id);

  if (filters.dayOfWeek) {
    query = query.eq("day_of_week", filters.dayOfWeek);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
