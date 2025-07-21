import { supabaseClient } from "../client";
import { Tables, TablesUpdate } from "../types";

export async function createChatRoom(userId: string, category: string) {
  const { data: newRoom, error } = await supabaseClient
    .from("chat_room")
    .insert({
      patient_id: userId,
      category,
      last_admin_read_at: new Date().toDateString(),
      last_user_read_at: new Date().toDateString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating chat room: ${error.message}`);
  }
  return newRoom;
}

export async function fetchRooms(
  filters: Partial<Tables<"chat_room">> = {},
  limit?: number,
  offset?: number
) {
  let query = supabaseClient.from("chat_room").select("*");

  if (filters.patient_id) {
    query = query.eq("patient_id", filters.patient_id);
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (typeof limit === "number") {
    query = query.range(
      typeof offset === "number" ? offset : 0,
      typeof offset === "number" ? offset + limit - 1 : limit - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  // Ensure data is an array

  return data;
}

export async function fetchRoom(filters: Partial<Tables<"chat_room">>) {
  const query = supabaseClient.from("chat_room").select("*");

  if (filters.patient_id) {
    query.eq("patient_id", filters.patient_id);
  }

  if (filters.category) {
    query.eq("category", filters.category);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Error fetching chat room: ${error.message}`);
  }

  return data;
}

export async function updateRoom(
  roomId: string,
  newData: TablesUpdate<"chat_room">
) {
  await supabaseClient.from("chat_room").update(newData).eq("id", roomId);
}

/**
 * Updates the last_admin_read_at field for a chat room.
 * @param roomId The ID of the chat room
 * @param date Optional date string (defaults to now)
 */
export async function updateLastAdminReadAt(roomId: string, date?: string) {
  const now = date || new Date().toISOString();

  const { error } = await supabaseClient
    .from("chat_room")
    .update({ last_admin_read_at: now })
    .eq("id", roomId);
  if (error)
    throw new Error(`Error updating last_admin_read_at: ${error.message}`);
  return now;
}

/**
 * Fetch chat rooms ordered by latest message using the Supabase Edge Function (RPC).
 * Falls back to the old method if RPC is not available.
 * @param search Optional search string for patient name
 * @param limit Pagination limit
 * @param offset Pagination offset
 */
export async function fetchRoomsByLatestMessage(
  search?: string,
  limit: number = 20,
  offset: number = 0
) {
  const { data, error } = await supabaseClient.rpc(
    "fetch_rooms_by_latest_message",
    {
      p_search: search || undefined,
      p_limit: limit,
      p_offset: offset,
    }
  );
  if (error) {
    console.error("Error fetching rooms by latest message:", error.message);
    return [];
  }
  return data;
}
