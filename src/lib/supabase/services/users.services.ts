import { supabaseClient } from "../client";
import { startOfDay } from "date-fns";
import { Tables } from "../types";

interface Filters extends Partial<Tables<"user">> {
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

  if (filters.clinic_id) {
    query = query.eq("clinic_id", filters.clinic_id);
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

/**
 * Fetch paginated users with email using the Supabase RPC function.
 * Supports same filters as getPaginatedUsers, but also returns email.
 */
export async function getPaginatedUsersWithEmail(
  page = 1,
  limit = 10,
  filters: Filters = {},
  sort: string = "created_at",
  order: string = "desc"
) {
  const { full_name, category, date_range } = filters;
  const { data, error } = await supabaseClient.rpc(
    "get_paginated_users_with_email",
    {
      p_page: page,
      p_limit: limit,
      p_full_name: full_name || undefined,
      p_category: category || undefined,
      p_date_from: date_range?.from
        ? startOfDay(date_range.from).toISOString()
        : undefined,
      p_date_to: date_range?.to || undefined,
      p_sort: sort,
      p_order: order,
    }
  );
  if (error) throw error;

  // data is an array with one object: { items: [...], total: number }
  const result =
    Array.isArray(data) && data.length > 0 ? data[0] : { items: [], total: 0 };
  // Ensure items is always an array of objects
  const items = Array.isArray(result.items)
    ? result.items
    : typeof result.items === "string"
    ? JSON.parse(result.items)
    : [];
  const totalPages = result.total ? Math.ceil(result.total / limit) : 1;

  return {
    data: items,
    totalItems: result.total ?? 0,
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
  //check first if the clinic is active
  const { data: clinicData, error: clinicError } = await supabaseClient
    .from("clinic")
    .select("id, status")
    .eq("id", clinic_id)
    .single();

  if (clinicError) throw clinicError;
  if (!clinicData || clinicData.status !== "active") {
    throw new Error("선택하신 병원이 삭제되었습니다.", {
      cause: "deleted-clinic",
    });
    //The clinic you selected has been deleted
  }

  //check all the treatments are not deleted
  const { data: deletedTreatments, error: deletedTreatmentsError } =
    await supabaseClient
      .from("treatment")
      .select("id, status, treatment_name")
      .in("id", treatments)
      .eq("status", "deleted");

  if (deletedTreatmentsError) throw deletedTreatmentsError;
  if (deletedTreatments.length > 0) {
    throw new Error(
      `선택하신 치료 중 일부가 삭제되었습니다: ${deletedTreatments
        .map((t) => t.treatment_name)
        .join(", ")}`,
      { cause: "deleted-treatments" }
    );
    //Some of the treatments you selected have been deleted
  }

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

  //do a loop here to insert the dentist's departments
  const dentistId = result.data.id;

  // Insert departments
  if (departments.length > 0) {
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
      }));
      const { error: treatmentError } = await supabaseClient
        .from("clinic_treatment")
        .insert(treatmentInserts);

      if (treatmentError) throw treatmentError;
    }
  }

  return result.data;
}

export async function softDeleteUser(userId: string) {
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

/**
 * Register a user from Kakao OAuth (no email/password, just profile info)
 */
export async function registerKakaoUser(
  data: Omit<Tables<"user">, "created_at" | "login_status"> & {
    email: string;
  }
): Promise<{ data: Tables<"user"> }> {
  // Insert user profile into 'user' table (assume Auth user already exists)
  const { data: userData, error: insertError } = await supabaseClient
    .from("user")
    .insert([
      {
        full_name: data.full_name,
        gender: data.gender,
        birthdate: data.birthdate,
        residence: data.residence,
        work_place: data.work_place,
        role: data.role,
        contact_number: data.contact_number,
        clinic_id: data.clinic_id,
        id: data.id, // should be the Supabase Auth user id
      },
    ])
    .select()
    .single();

  await supabaseClient.auth.updateUser({
    data: { role: "patient" },
  });

  if (insertError) throw insertError;
  return { data: userData };
}
