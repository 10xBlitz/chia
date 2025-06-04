import { startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { Tables } from "../types";

// Helper to fetch reservations for the current user
// async function fetchReservations(userId: string) {
//   const { data, error } = await supabaseClient
//     .from("reservation")
//     .select(
//       `
//       *,
//       clinic_treatment(
//         *,
//         clinic(clinic_name),
//         treatment(treatment_name)
//       ),
//       payment(*)
//     `
//     )
//     .eq("patient_id", userId)
//     .order("reservation_date", { ascending: false })
//     .order("reservation_time", { ascending: false });

//   if (error) throw new Error(error.message);
//   return data;
// }

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
      clinic_treatment(
        *,
        treatment(*),
        clinic(*)
      ),
      payment(*)
    `,
      { count: "exact" }
    ) // dot-less select implies INNER JOIN
    .order("reservation_date", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filters
  // if (filters.treatment_id) {
  //   query = query.eq("clinic_treatment.treatment_id", filters.treatment_id);
  // }

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
  console.log("getPaginatedClinics", data, count, filters);

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
