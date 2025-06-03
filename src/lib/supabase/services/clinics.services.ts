import { startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { Tables } from "../types";

interface Filters {
  clinic_name?: string | null;
  treatment_id?: number | null;
  region?: string | null;
  date_range?: {
    from?: string;
    to?: string;
  };
}

export async function getPaginatedClinics(
  page = 1,
  limit = 10,
  filters: Filters = {}
) {
  if (limit > 1000) throw Error("limit exceeds 1000");
  if (limit < 1) throw Error("limit must be a positive number");

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("clinic")
    .select(
      `
     *, 
     clinic_view(*),
     clinic_treatment (
        *,
        treatment (*)
      )
   
    `,
      { count: "exact" }
    )
    .filter("clinic_treatment.status", "not.eq", "deleted")
    .order("clinic_name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (filters.clinic_name) {
    query = query.ilike("clinic_name", `%${filters.clinic_name}%`);
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
  console.log("getPaginatedClinics", data, count);

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

export async function getPaginatedClinicsWthReviews(
  page = 1,
  limit = 10,
  filters: Filters = {}
) {
  if (limit > 1000) throw Error("limit exceeds 1000");
  if (limit < 1) throw Error("limit must be a positive number");

  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from("clinic")
    .select(
      `
        *,
        clinic_treatment(
          id,
          reservation(*),
          review(*)
        )
      `,
      { count: "exact" }
    )
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (filters.region) {
    query = query.eq("region", filters.region);
  }

  if (filters.clinic_name) {
    query = query.ilike("clinic_name", `%${filters.clinic_name}%`);
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
  console.log("getPaginatedClinics", data, count);

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

// --- Clinic Images Storage Helpers ---
export async function uploadClinicImages(
  files: File[],
  clinicId: string,
  setUploadingFileIndex?: (idx: number | null) => void
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (setUploadingFileIndex) setUploadingFileIndex(i);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `clinic-images/${clinicId}/${fileName}`;
    const { error } = await supabaseClient.storage
      .from("clinic-images")
      .upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabaseClient.storage
      .from("clinic-images")
      .getPublicUrl(filePath);
    if (!data?.publicUrl) throw new Error("Failed to get image URL");
    urls.push(data.publicUrl);
  }
  if (setUploadingFileIndex) setUploadingFileIndex(null);
  return urls;
}

export async function removeClinicImagesFromStorage(imageUrls: string[]) {
  if (!imageUrls || imageUrls.length === 0) return;
  const paths = imageUrls
    .map((url) => {
      // Extract the path after the bucket name (clinic-images/)
      const match = url.match(/clinic-images\/(.+)$/);
      return match ? match[1] : null;
    })
    .filter(Boolean) as string[];
  if (paths.length > 0) {
    await supabaseClient.storage.from("clinic-images").remove(paths);
  }
}

export async function updateClinic(
  clinicId: string,
  values: Omit<Tables<"clinic">, "id" | "created_at">,
  pictures: string[]
) {
  const { error } = await supabaseClient
    .from("clinic")
    .update({
      clinic_name: values.clinic_name,
      contact_number: values.contact_number,
      location: values.location,
      region: values.region,
      opening_date: values.opening_date,
      link: values.link,
      pictures,
    })
    .eq("id", clinicId);
  if (error) throw error;
}

export async function insertClinic(
  values: Omit<Tables<"clinic">, "id" | "created_at">,
  pictures: string[]
) {
  const { data: insertedClinic, error } = await supabaseClient
    .from("clinic")
    .insert({
      clinic_name: values.clinic_name,
      contact_number: values.contact_number,
      location: values.location,
      region: values.region,
      opening_date: values.opening_date,
      link: values.link,
      pictures,
    })
    .select("id")
    .single();
  if (error) throw error;
  return insertedClinic.id;
}
