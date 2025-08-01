import { startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { Tables, TablesUpdate } from "../types";

export async function getPaginatedReservations(
  page = 1,
  limit = 10,
  filters: Partial<Tables<"reservation">> & {
    date_range?: { from?: string; to?: string };
  } & Partial<Tables<"user">>
) {
  if (limit > 1000) throw Error("limit exceeds 1000");
  if (limit < 1) throw Error("limit must be a positive number");

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("reservation")
    .select(
      `
      *,
      patient:user!patient_id ( 
        id, 
        full_name, 
        residence, 
        birthdate,
        work_place, 
        contact_number
       ),
      clinic_treatment!inner(
        *,
        treatment!inner(*),
        clinic!inner(*)
      ),
      payment(*)
    `,
      { count: "exact" }
    )
    .eq("clinic_treatment.clinic.status", "active") // Only show reservations from active clinics
    .eq("clinic_treatment.treatment.status", "active") // Only show reservations for active treatments
    .eq("clinic_treatment.status", "active") // Only show reservations for active clinic treatments
    .order("reservation_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.full_name) {
    query = query.ilike("patient.full_name", `%${filters.full_name}%`);
    query = query.not("patient", "is", null);
  }

  if (filters.patient_id) {
    query = query.eq("patient_id", filters.patient_id);
  }

  // Date range filter
  if (filters.date_range?.from && filters.date_range?.to) {
    query = query.gte(
      "reservation_date",
      startOfDay(filters.date_range.from).toISOString()
    );
    query = query.lte("reservation_date", filters.date_range.to);
  }

  const { data, error, count } = await query;

  console.log("---->data", data);

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

export async function insertReservation(reservation: {
  reservation_date: string;
  reservation_time: string;
  consultation_type: string;
  contact_number: string;
  patient_id: string;
  clinic_treatment_id: string;
}) {
  const { data, error } = await supabaseClient
    .from("reservation")
    .insert([reservation])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateReservation(
  reservationId: string,
  updates: TablesUpdate<"reservation">
) {
  const { data, error } = await supabaseClient
    .from("reservation")
    .update(updates)
    .eq("id", reservationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReservation(reservationId: string) {
  const { data, error } = await supabaseClient
    .from("reservation")
    .delete()
    .eq("id", reservationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
