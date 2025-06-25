import { supabaseClient } from "@/lib/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/types";
import { endOfDay, startOfDay } from "date-fns";

// Get paginated banners
export type BannerFilter = Partial<Tables<"banner">> & {
  startDate?: string;
  endDate?: string;
};

export async function getPaginatedBanners(
  page = 1,
  limit = 10,
  filters: BannerFilter = {}
) {
  const offset = (page - 1) * limit;
  let query = supabaseClient
    .from("banner")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.banner_type) {
    query = query.eq("banner_type", filters.banner_type);
  }
  if (filters.title) {
    query = query.ilike("title", `%${filters.title}%`);
  }
  if (filters.startDate) {
    query = query.gte(
      "created_at",
      startOfDay(filters.startDate).toDateString()
    );
  }
  if (filters.endDate) {
    query = query.lte("created_at", endOfDay(filters.endDate).toDateString());
  }

  console.log("Querying banners with filters:", {
    page,
    limit,
    filters,
    offset,
  });

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

// Insert banner
export async function insertBanner(values: TablesInsert<"banner">) {
  const { error, data } = await supabaseClient
    .from("banner")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update banner
export async function updateBanner(id: string, values: TablesUpdate<"banner">) {
  const { error, data } = await supabaseClient
    .from("banner")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete banner
export async function deleteBanner(id: string) {
  const { error } = await supabaseClient.from("banner").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// Get single banner
export async function getSingleBanner(id: string) {
  const { data, error } = await supabaseClient
    .from("banner")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
