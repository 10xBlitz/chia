import { startOfDay } from "date-fns";
import { supabaseClient } from "../client";

interface Filters {
  full_name?: string | null;
  treatment_id?: number | null;
  date_range?: {
    from?: string;
    to?: string;
  };
}

export async function getPaginatedReservations(
  page = 1,
  limit = 10,
  filters: Filters = {}
) {
  if (limit > 1000) throw Error("limit exceeds 1000");
  if (limit < 1) throw Error("limit must be a positive number");

  const offset = (page - 1) * limit;

//   export type ReservationTable = {
//   id: number;
//   category: string;
//   name: string;
//   residence: string;
//   workplace: string;
//   contact_number: string;
//   clinic_name: string;
// };

  let query = supabaseClient
    .from("reservation")
    .select(`
      id,
      reservation_date,
      patient:user!patient_id ( 
        id, 
        full_name, 
        residence, 
        birthdate,
        work_place, 
        contact_number
       ),
      clinic_treatment(
        id,
        treatment(
          treatment_name
        ),
        clinic(
          clinic_name
        )
      )
    `, { count: "exact" }) // dot-less select implies INNER JOIN
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  // Filters
  // if (filters.treatment_id) {
  //   query = query.eq("clinic_treatment.treatment_id", filters.treatment_id);
  // }

  if (filters.full_name) {
    query = query.ilike("patient.full_name", `%${filters.full_name}%`);
    query = query.not("patient", "is", null);
  }


 // Date range filter
  if (filters.date_range?.from && filters.date_range?.to) {
    query = query.gte("reservation_date", (startOfDay(filters.date_range.from)).toISOString());
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
