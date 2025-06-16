import { supabaseClient } from "../client";
import { TablesInsert } from "../types";

/**
 * This function is used specifically for tanstacks' infiniteQuery
 *
 * @param chatRoomId the ID of the chat room to fetch messages from
 * @param pageParam this is used for pagination, it should be the created_at timestamp of the last message fetched in the previous page
 * @returns
 */
export async function fetchMessagesOfRoom(
  chatRoomId: string,
  pageParam?: string
) {
  if (!chatRoomId) return [];
  const PAGE_SIZE = 20;
  let query = supabaseClient
    .from("message")
    .select("*, sender:sender_id(full_name)")
    .eq("chat_room_id", chatRoomId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  // Only add .lt if pageParam is a valid string
  if (typeof pageParam === "string" && pageParam) {
    query = query.lt("created_at", pageParam);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (
    data?.map((msg) => ({
      id: msg.id,
      content: msg.content,
      user: { name: msg.sender?.full_name || "Unknown Sender" },
      createdAt: msg.created_at,
    })) || []
  );
}

export async function fetchLatestMessageOfRoom(roomId: string) {
  const { data, error } = await supabaseClient
    .from("message")
    .select("created_at")
    .eq("chat_room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function insertMessage(message: TablesInsert<"message">) {
  const { data, error } = await supabaseClient
    .from("message")
    .insert(message)
    .select()
    .single();
  if (error) throw error;

  return data;
}

/**
 *
 * @param userId this is to filter only the message of admin. so that the messages of the sender is not counted
 * @param roomId the roomId to fetch the unread messages from
 * @param lastPatientReadAt pointer to the date of the latest message the patient has seen.
 * @returns Promise<number>
 */
export async function fetchUnreadMessageCountOfRoom(
  userId: string,
  roomId: string,
  lastPatientReadAt: string
): Promise<number> {
  const { count, error } = await supabaseClient
    .from("message")
    .select("*", { count: "exact", head: true })
    .eq("chat_room_id", roomId)
    .filter("sender_id", "not.eq", userId)
    .gt("created_at", lastPatientReadAt);
  if (error) {
    //not throw error here, so that it returns 0
    console.error(
      `Error fetching unread count for room ${roomId}:`,
      error.message
    );
    return 0;
  }
  return count || 0;
}
