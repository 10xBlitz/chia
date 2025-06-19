import { supabaseClient } from "../client";

/**
 * Fetch working hours for a clinic
 * @param clinic_id Clinic ID
 * @returns Array of working hour rows for the clinic
 */
export async function fetchClinicWorkingHours(clinic_id: string) {
  const { data, error } = await supabaseClient
    .from("working_hour")
    .select("*")
    .eq("clinic_id", clinic_id);
  if (error) throw error;
  return data;
}
