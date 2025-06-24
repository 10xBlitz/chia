import { supabaseClient } from "../client";
import { startOfDay } from "date-fns";
import { Tables } from "../types";

interface Filters {
  full_name?: string | null;
  category?: "patient" | "dentist" | "admin" | "dentist employee";
  date_range?: {
    from?: string;
    to?: string;
  };
}

export async function getPaginatedUsers(
  page = 1,
  limit = 10,
  filters: Filters = {},
  sort: string = "created_at",
  order: string = "desc"
) {
  console.log("---->getPaginatedUsers", { page, limit, filters, sort, order });

  if (limit > 1000) {
    throw Error("limit exceeds 1000");
  }

  if (limit < 1) {
    throw Error("limit must be a positive number");
  }

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("user")
    .select("*", { count: "exact" })
    .eq("login_status", "active")
    .order(sort, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  // Filters
  if (filters.full_name) {
    query = query.ilike("full_name", `%${filters.full_name}%`);
  }

  if (filters.category) {
    query = query.eq("role", filters.category);
  }

  // Date range filter
  if (filters.date_range?.from && filters.date_range?.to) {
    query = query.gte(
      "created_at",
      startOfDay(filters.date_range.from).toISOString()
    );
    query = query.lte("created_at", filters.date_range.to);
  }

  const { data, error, count } = await query;

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

// Update user profile fields (except email)
export async function updateUserProfile(
  userId: string,
  values: {
    full_name: string;
    contact_number: string;
    residence: string;
    birthdate: Date;
    gender: string;
    work_place: string;
  }
) {
  // Separate email from other fields
  const { ...profileFields } = values;

  // Update user table (excluding email)
  const { error: profileError } = await supabaseClient
    .from("user")
    .update({
      ...profileFields,
      birthdate: profileFields.birthdate.toDateString(),
    })
    .eq("id", userId);
  if (profileError) throw profileError;
}

export async function updateUserPassword(newPassword: string) {
  // Update user password using Supabase auth
  const { error } = await supabaseClient.auth.updateUser({
    password: newPassword,
  });
  console.log("---->updateUserPassword error: ", error);
  if (error) throw error;
}

export async function updateLoginStatus(
  userId: string,
  status: Tables<"user">["login_status"]
) {
  // Update login status in the user table
  const { error } = await supabaseClient
    .from("user")
    .update({ login_status: status })
    .eq("id", userId);
  if (error) throw error;
}

// Get a single user by id
export async function getUserById(userId: string) {
  const { data, error } = await supabaseClient
    .from("user")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function registerUser(
  data: Omit<Tables<"user">, "id" | "created_at" | "login_status"> & {
    email: string;
    password: string;
  }
): Promise<{ data: Tables<"user"> }> {
  const { data: authUser, error } = await supabaseClient.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        role: data.role, // Default role, can be overridden later
      },
    },
  });
  if (error) throw error;

  // Insert user profile into 'user' table after successful signup
  const { data: userData, error: insertError } = await supabaseClient
    .from("user")
    .insert([
      {
        id: authUser.user?.id as string,
        full_name: data.full_name,
        gender: data.gender,
        birthdate: data.birthdate,
        residence: data.residence,
        work_place: data.work_place,
        role: data.role,
        contact_number: data.contact_number,
        clinic_id: data.clinic_id,
      },
    ])
    .select()
    .single();
  if (insertError) throw insertError;

  return { data: userData }; //Sign up completed successfully
}

export async function registerDentist({
  full_name,
  email,
  password,
  treatments,
  departments,
  clinic_id,
  gender,
  contact_number,
  birthdate,
  residence,
  work_place,
}: {
  full_name: string;
  email: string;
  password: string;
  clinic_id: string;
  treatments: string[];
  departments: string[];
  gender: string;
  contact_number: string;
  birthdate: string | Date;
  residence: string;
  work_place: string;
}) {
  const result = await registerUser({
    birthdate:
      typeof birthdate === "string" ? birthdate : birthdate.toISOString(),
    clinic_id,
    contact_number,
    full_name,
    gender,
    residence,
    work_place,
    email,
    password,
    role: "dentist",
  });
  console.log("---->registerDentist result: ", result);

  //do a loop here to insert the dentist's departments
  const dentistId = result.data.id;

  // Insert departments
  if (departments.length > 0) {
    console.log("--->inserting departments");
    const departmentInserts = departments.map((department) => ({
      dentist_id: dentistId,
      clinic_department_id: department,
    }));
    const { error: departmentError } = await supabaseClient
      .from("dentist_clinic_department")
      .insert(departmentInserts);
    if (departmentError) throw departmentError;
  }

  //do a loop here to add the treatments inside the clinic_treatment table if it is not there yet
  //make sure to check if the treatment already exists for this clinic
  if (treatments.length > 0) {
    console.log("--->inserting treatments");

    // 1. Get existing treatments for this clinic
    const { data: existingTreatments, error: fetchError } = await supabaseClient
      .from("clinic_treatment")
      .select("treatment_id")
      .eq("clinic_id", clinic_id);

    if (fetchError) throw fetchError;

    const existingTreatmentIds = (existingTreatments ?? []).map(
      (row) => row.treatment_id
    );

    // 2. Filter out treatments that already exist
    const newTreatments = treatments.filter(
      (treatment) => !existingTreatmentIds.includes(treatment)
    );

    // 3. Insert only new treatments
    if (newTreatments.length > 0) {
      const treatmentInserts = newTreatments.map((treatment) => ({
        clinic_id: clinic_id,
        treatment_id: treatment,
        price: 0,
      }));
      const { error: treatmentError } = await supabaseClient
        .from("clinic_treatment")
        .insert(treatmentInserts);

      if (treatmentError) throw treatmentError;
    }
  }

  return result.data;
}

export async function setUserDeleted(userId: string) {
  // Set the user's status to deleted
  const { error } = await supabaseClient
    .from("user")
    .update({ login_status: "inactive" })
    .eq("id", userId);
  if (error) throw error;
}

/**
 * Registers a new admin user.
 * @param data - Admin signup form data
 */
export async function registerAdmin(data: {
  full_name: string;
  email: string;
  password: string;
  gender: string;
  contact_number: string;
  birthdate: string; // ISO string
  residence: string;
  work_place: string;
  adminPassword: string;
}) {
  // Check admin password via API route (server-side)
  const res = await fetch("/api/admin-signup-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: data.adminPassword }),
  });
  const result = await res.json();
  if (!result.success) {
    throw new Error(result.error || "관리자 비밀번호가 올바르지 않습니다.");
  }
  // Register user using the shared registerUser function
  const { data: userData } = await registerUser({
    email: data.email,
    password: data.password,
    full_name: data.full_name,
    gender: data.gender,
    contact_number: data.contact_number,
    birthdate: data.birthdate,
    residence: data.residence,
    work_place: data.work_place,
    role: "admin",
    clinic_id: null, // Admins do not belong to a clinic
  });
  return userData;
}
