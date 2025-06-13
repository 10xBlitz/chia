import { supabaseClient } from "@/lib/supabase/client";
import { ChatMessage } from "../../patient/profile/chat/hooks/use-realtime-chat";

// --- Types ---
export interface ChatRoomFromDB {
  id: string;
  category: string | null;
  user: { full_name: string | null } | null;
  last_admin_read_at: string | null;
  latest_message_created_at: string | null; // <-- add this
}

export interface DisplayRoomInfo {
  room_id: string;
  person_name: string;
  category: string | null;
  latest_message_timestamp: string | null;
  unread_message_count: number;
}

// --- Data Fetching Functions ---

export async function fetchChatRooms(
  search?: string,
  limit?: number,
  offset?: number
): Promise<ChatRoomFromDB[]> {
  // Call the RPC function (no userId param)
  const { data, error } = await supabaseClient.rpc(
    "fetch_rooms_by_latest_message",
    {
      p_search: search && search.trim() ? search : undefined,
      p_limit: limit ?? 20,
      p_offset: offset ?? 0,
    }
  );

  console.log("---->rpc: ", data);

  if (error) throw error;

  // Map the result to ChatRoomFromDB shape
  return (
    data?.map((row) => ({
      id: row.id,
      category: row.category,
      user: { full_name: row.patient_full_name },
      last_admin_read_at: row.last_admin_read_at,
      latest_message_created_at: row.latest_message_created_at, // <-- add this
    })) ?? []
  );
}

export async function fetchRoomDetails(
  userId: string | undefined,
  initialRoomsData: ChatRoomFromDB[] | undefined
): Promise<DisplayRoomInfo[]> {
  if (!userId || !initialRoomsData || initialRoomsData.length === 0) return [];

  // Fetch unread count for all rooms in parallel (no need to fetch latest message timestamp)
  const processedRooms: DisplayRoomInfo[] = await Promise.all(
    initialRoomsData.map(async (room) => {
      const unreadCount = await getUnreadMessageCount(
        userId,
        room.id,
        room.last_admin_read_at || "1970-01-01T00:00:00Z"
      );
      return {
        room_id: room.id,
        person_name: room.user?.full_name || "Unknown User",
        category: room.category,
        latest_message_timestamp: room.latest_message_created_at,
        unread_message_count: unreadCount,
      };
    })
  );
  return processedRooms;
}

export async function getLatestMessageTimestamp(
  roomId: string
): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from("message")
    .select("created_at")
    .eq("chat_room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error(
      `Error fetching latest message for room ${roomId}:`,
      error.message
    );
    return null;
  }
  return data?.created_at || null;
}

export async function getUnreadMessageCount(
  userId: string,
  roomId: string,
  lastAdminReadTimestamp: string
): Promise<number> {
  try {
    const { count, error } = await supabaseClient
      .from("message")
      .select("*", { count: "exact", head: true })
      .eq("chat_room_id", roomId)
      .not("sender_id", "eq", userId) // <-- fix here: use not("sender_id", "eq", userId)
      .gt("created_at", lastAdminReadTimestamp);

    if (error) {
      console.log("---->error fetching unread count: ", {
        userId,
        roomId,
        lastAdminReadTimestamp,
        error,
      });
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("Exception in getUnreadMessageCount:", err);
    return 0;
  }
}

// --- Update Functions ---

/**
 * Get the latest message timestamp for a room, or the current time if not found.
 * @param roomId - The ID of the room to check.
 * @param openRooms - The list of open rooms to search in.
 * @returns The latest message timestamp or current time if not found.
 */
export function getRoomLatestTimestamp(
  roomId: string,
  openRooms: DisplayRoomInfo[]
): string {
  const roomInfo = openRooms.find((room) => room.room_id === roomId);
  return roomInfo?.latest_message_timestamp || new Date().toISOString();
}

export async function updateLastAdminReadAt(
  roomId: string,
  timestamp: string
): Promise<void> {
  // Ensure timestamp is a valid ISO string, not "null"
  if (!timestamp || timestamp === "null") {
    timestamp = new Date().toISOString();
  }
  console.log("----> updateLastAdminReadAt: ", { roomId, timestamp });
  const { error } = await supabaseClient
    .from("chat_room")
    .update({ last_admin_read_at: timestamp })
    .eq("id", roomId);
  if (error) throw error;
}

export async function fetchMessagesForRoom(
  selectedRoom: string | null
): Promise<ChatMessage[]> {
  if (!selectedRoom) return [];
  const { data, error } = await supabaseClient
    .from("message")
    .select("*, sender:sender_id(full_name)")
    .eq("chat_room_id", selectedRoom)
    .order("created_at", { ascending: true });

  console.log("---->fetchMessagesForRoom: ", error);
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

// --- Realtime Handler ---

export function handleRealtimeMessage(
  channelName: string,
  selectedRoom: string | null,
  updateRoomLastReadDate: (roomId: string, referenceTimestamp?: string) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryClient: any,
  userId: string | undefined,
  debouncedSearch?: string | null,
  roomLimit?: number | null
) {
  const messageSubscription = supabaseClient
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "message" },
      (payload) => {
        // Only refetch if the message is NOT from the current user

        if (payload.new.sender_id !== userId) {
          console.log(
            "Realtime: >>> New message event RECEIVED! Room:",
            payload.new.chat_room_id
          );
          queryClient.refetchQueries({
            queryKey: [
              "admin_chat_rooms_list_with_read_status",
              debouncedSearch,
              roomLimit,
            ],
          });
          queryClient.refetchQueries({
            queryKey: [
              "admin_rooms_with_unread_details",
              debouncedSearch,
              roomLimit,
            ],
          });
          const newMsgRoomId = payload.new.chat_room_id;
          if (newMsgRoomId && selectedRoom && newMsgRoomId === selectedRoom) {
            console.log(
              `Realtime: New message in selected room ${selectedRoom}, marking as read.`
            );
            updateRoomLastReadDate(selectedRoom, payload.new.created_at);
          }
        }
      }
    )
    .subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        console.log(
          `Realtime: Successfully SUBSCRIBED to ${channelName} for message inserts!`
        );
      } else if (err) {
        console.error(`Realtime subscription to ${channelName} error:`, err);
      }
    });
  return messageSubscription;
}
