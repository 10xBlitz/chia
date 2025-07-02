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

// --- Working Hours (Clinic Hours) ---

/**
 * Inserts all working hours for a clinic. Overwrites existing hours if used after deleteClinicWorkingHours.
 * @param clinicId - The clinic ID
 * @param hours - Array of working hour objects
 */
export async function insertClinicWorkingHours(
  clinicId: string,
  hours: Array<{
    day_of_week: Enums<"day_of_week">;
    time_open_from: string;
    time_open_to: string;
    note?: string;
  }>
) {
  if (!clinicId || !Array.isArray(hours)) return;
  if (hours.length === 0) return;
  const { error } = await supabaseClient.from("working_hour").insert(
    hours.map((h) => ({
      clinic_id: clinicId,
      day_of_week: h.day_of_week,
      time_open_from: h.time_open_from,
      time_open_to: h.time_open_to,
    }))
  );
  if (error) throw error;
}

/**
 * Deletes all working hours for a clinic. Useful before re-inserting on update.
 * @param clinicId - The clinic ID
 */
export async function deleteClinicWorkingHours(clinicId: string) {
  if (!clinicId) return;
  const { error } = await supabaseClient
    .from("working_hour")
    .delete()
    .eq("clinic_id", clinicId);
  if (error) throw error;
}
