import { fetchClinicWorkingHours } from "@/lib/supabase/services/working-hour.services";
import { Constants } from "@/lib/supabase/types";

/**
 * Returns an array of weekday numbers (0=Sunday, 1=Monday, ...) that are NOT present in the clinic's working hours.
 * @param clinic_id Clinic ID
 */
export async function getDisabledWeekdaysForClinic(
  clinic_id: string
): Promise<number[]> {
  // Fetch all working hours for the clinic
  const allWorkingHours = await fetchClinicWorkingHours(clinic_id);
  // All possible weekdays in Korean
  const allWeekdays = Constants.public.Enums.day_of_week.slice(0, 7); // Exclude 점심시간
  // Find which weekdays are present in working hours
  const openDays = new Set((allWorkingHours || []).map((wh) => wh.day_of_week));
  // Return weekday numbers that are NOT present in openDays
  return allWeekdays
    .map((day, idx) => (openDays.has(day) ? null : idx))
    .filter((v) => v !== null) as number[];
}
