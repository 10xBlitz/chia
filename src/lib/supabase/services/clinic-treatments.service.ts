import { supabaseClient } from "../client";

/**
 * Marks a clinic treatment as deleted by setting its status to "deleted".
 *
 * @param clinicId - The clinic's ID.
 * @param treatmentId - The treatment's ID.
 * @example
 * await markClinicTreatmentDeleted("clinic-123", "treatment-456");
 */
export async function markClinicTreatmentDeleted(
  clinicId: string,
  treatmentId: string
) {
  await supabaseClient
    .from("clinic_treatment")
    .update({ status: "deleted" })
    .eq("clinic_id", clinicId)
    .eq("treatment_id", treatmentId);
}

/**
 * Inserts a new clinic treatment with status "active".
 *
 * @param clinicId - The clinic's ID.
 * @param treatmentId - The treatment's ID.
 * @param price - The price for the treatment.
 * @example
 * await insertClinicTreatment("clinic-123", "treatment-456", 10000);
 */
export async function insertClinicTreatment(
  clinicId: string,
  treatmentId: string
) {
  const { data, error } = await supabaseClient
    .from("clinic_treatment")
    .insert({
      clinic_id: clinicId,
      treatment_id: treatmentId,
      status: "active",
    })
    .select();

  if (error) throw error;
  return data[0];
}

/**
 * Updates the price and sets status to "active" for a clinic treatment.
 *
 * @param clinicId - The clinic's ID.
 * @param treatmentId - The treatment's ID.
 * @param price - The new price for the treatment.
 * @example
 * await updateClinicTreatment("clinic-123", "treatment-456", 12000);
 */
export async function updateClinicTreatment(
  clinicId: string,
  treatmentId: string
) {
  await supabaseClient
    .from("clinic_treatment")
    .update({ status: "active" })
    .eq("clinic_id", clinicId)
    .eq("treatment_id", treatmentId);
}
