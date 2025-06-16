import { supabaseClient } from "../client";
import { Tables, TablesUpdate } from "../types";

export async function createChatRoom(userId: string, category: string) {
  const { data: newRoom, error } = await supabaseClient
    .from("chat_room")
    .insert({ patient_id: userId, category })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating chat room: ${error.message}`);
  }
  return newRoom;
}

export async function fetchRooms(filters: Partial<Tables<"chat_room">> = {}) {
  let query = supabaseClient.from("chat_room").select("*");

  if (filters.patient_id) {
    query = query.eq("patient_id", filters.patient_id);
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  console.log("---->Fetched chat rooms:", data);
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
