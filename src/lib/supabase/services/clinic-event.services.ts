import { endOfDay, startOfDay } from "date-fns";
import { supabaseClient } from "../client";
import { TablesInsert } from "../types";
import {
  deleteFileFromSupabase,
  uploadFileToSupabase,
} from "./upload-file.services";

const CLINIC_EVENT_TREATMENTS = "clinic-event-images";
const CLINIC_EVENT_MAX_MB = 50 * 1024 * 1024; // 50 MB
const CLINIC_EVENT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function getPaginatedClinicEvents(
  page = 1,
  limit = 10,
  filters: {
    date_range?: {
      from?: string;
      to?: string;
    };
    clinic_name?: string;
    discount?: number;
  }
) {
  try {
    if (limit > 1000) {
      throw Error("Limit exceeds 100");
    }
    if (limit < 1) {
      throw Error("Limit must be a positive number");
    }

    const offset = (page - 1) * limit;

    let query = supabaseClient
      .from("event")
      .select("*, clinic_treatment!inner(clinic!inner(*)) ", { count: "exact" })
      .neq("status", "deleted")
      .filter("clinic_treatment.clinic.status", "neq", "deleted") // Only show events from active clinics
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    // Filters
    if (filters.clinic_name) {
      query = query.ilike(
        "clinic_treatment.clinic.clinic_name",
        `%${filters.clinic_name}%`
      );
      query = query.filter("clinic_treatment", "not.is", null);
      query = query.filter("clinic_treatment.clinic", "not.is", null);
    }

    if (filters.date_range?.from && filters.date_range?.to) {
      query = query.gte(
        "created_at",
        startOfDay(new Date(filters.date_range.from)).toDateString()
      );
      query = query.lte(
        "created_at",
        endOfDay(new Date(filters.date_range.to)).toDateString()
      );
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
  } catch (error) {
    console.log("---->error: ", error);
    throw error;
  }
}

type InsertEventInput = Omit<
  TablesInsert<"event">,
  "image_url" | "id" | "created_at"
> & {
  image: string | File | null;
};

export async function insertClinicEvent(
  event: InsertEventInput,
  progress: (prog: string | null) => void
) {
  let imageUrl: string | null = null;

  if (event.image instanceof File) {
    progress("이미지 업로드 중..."); // "Uploading image..."
    imageUrl = await uploadFileToSupabase(event.image, {
      bucket: CLINIC_EVENT_TREATMENTS,
      allowedMimeTypes: CLINIC_EVENT_ALLOWED_MIME_TYPES,
      maxSizeMB: CLINIC_EVENT_MAX_MB,
    });
  } else if (typeof event.image === "string") {
    imageUrl = event.image;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { image, ...eventWithNoImage } = event;

  progress("이벤트 등록 중..."); // "Registering event..."
  const { data, error } = await supabaseClient
    .from("event")
    .insert([{ ...eventWithNoImage, image_url: imageUrl }])
    .select()
    .single();
  progress(null);

  if (error) throw error;
  return data;
}

type UpdateEventInput = TablesInsert<"event"> & {
  id: string;
  image?: string | File | null;
};

export async function updateClinicEvent(
  event: UpdateEventInput,
  progress: (prog: string | null) => void
) {
  let imageUrl: string | null | undefined = undefined;

  // If a new image is provided and it's a File, remove the old image first
  if (event.image instanceof File) {
    // Get the current event to find the old image_url
    progress("기존 이미지 확인 중..."); // "Checking current image..."
    const { data: current, error: currentError } = await supabaseClient
      .from("event")
      .select("image_url")
      .eq("id", event.id)
      .single();
    if (currentError) throw currentError;

    // Remove old image from storage if it exists
    if (current?.image_url) {
      progress("기존 이미지 삭제 중..."); // "Deleting old image..."
      await deleteFileFromSupabase(current.image_url, {
        bucket: CLINIC_EVENT_TREATMENTS,
      });
    }

    // Upload new image
    progress("새 이미지 업로드 중..."); // "Uploading new image..."
    imageUrl = await uploadFileToSupabase(event.image, {
      bucket: CLINIC_EVENT_TREATMENTS,
      folder: "treatments",
      allowedMimeTypes: CLINIC_EVENT_ALLOWED_MIME_TYPES,
      maxSizeMB: CLINIC_EVENT_MAX_MB,
    });
  } else if (typeof event.image === "string") {
    imageUrl = event.image;
  }

  // Remove image from update payload
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, image, ...updateData } = event;

  // Only include image_url if it's defined (for partial updates)
  const updatePayload =
    imageUrl !== undefined
      ? { ...updateData, image_url: imageUrl }
      : updateData;
  progress("이벤트 업데이트 중..."); // "Updating event..."
  const { data, error } = await supabaseClient
    .from("event")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();
  progress(null);
  if (error) throw error;
  return data;
}

export async function softDeleteClinicEvent(eventId: string) {
  const { data, error } = await supabaseClient
    .from("event")
    .update({ status: "deleted" })
    .eq("id", eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
