import { supabaseClient } from "../client";

export async function getViewCountOfClinic(clinicId: string) {
  const { data, error } = await supabaseClient
    .from("clinic_view")
    .select("*", { count: "exact" })
    .eq("clinic_id", clinicId)
    .limit(1);

  if (error) {
    throw new Error(`Error fetching view count: ${error.message}`);
  }

  return data.length ?? 0; // Return 0 if no views found
}
