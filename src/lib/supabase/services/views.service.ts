import { supabaseClient } from "../client";

export async function getViewCountOfClinic(clinicId: string) {
  const { error, count } = await supabaseClient
    .from("clinic_view")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  if (error) {
    throw new Error(`Error fetching view count: ${error.message}`);
  }
  return count ?? 0; // Return 0 if no views found
}
