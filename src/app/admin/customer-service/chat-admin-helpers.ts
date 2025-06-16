import { supabaseClient } from "@/lib/supabase/client";
import { fetchUnreadMessageCountOfRoom } from "@/lib/supabase/services/messages.services";

// --- Types ---
export interface ChatRoomFromDB {
  id: string;
  category: string | null;
  user: { full_name: string | null } | null;
  last_admin_read_at: string | null;
  last_patient_read_at: string | null;
  latest_message_created_at: string | null;
}

export interface DisplayRoomInfo {
  room_id: string;
  person_name: string;
  category: string | null;
  latest_message_timestamp: string | null;
  unread_message_count: number;
  last_admin_read_at?: string | null;
  last_patient_read_at?: string | null;
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
      last_patient_read_at: row.last_patient_read_at,
      latest_message_created_at: row.latest_message_created_at, // <-- add this
    })) ?? []
  );
}

/**
 *
 * This function fetches room details for a given user and processes the initial rooms data.
 * It calculates the unread message count for each room based on the user's last read timestamp.
 *
 * @param userId - The ID of the user to fetch room details for.
 * @param initialRoomsData - The initial list of chat rooms to process.
 * @returns
 */
export async function fetchRoomDetails(
  userId: string | undefined,
  initialRoomsData: ChatRoomFromDB[] | undefined
): Promise<DisplayRoomInfo[]> {
  if (!userId || !initialRoomsData || initialRoomsData.length === 0) return [];
  const processedRooms: DisplayRoomInfo[] = await Promise.all(
    initialRoomsData.map(async (room) => {
      const unreadCount = await fetchUnreadMessageCountOfRoom(
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
        last_admin_read_at: room.last_admin_read_at || null,
        last_patient_read_at: room.last_patient_read_at || null,
      };
    })
  );
  return processedRooms;
}

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

/**
 * Subscribe to last_patient_read_at (last_user_read_at) changes for a room
 * Calls onUpdate with the new timestamp when it changes
 */
export function subscribeToLastPatientReadAt(
  roomId: string,
  onUpdate: (lastPatientReadAt: string | null) => void
) {
  if (!roomId) return null;
  const channel = supabaseClient
    .channel(`room-last-admin-read-at-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "chat_room",
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        const newReadAt = payload.new?.last_user_read_at;
        onUpdate(newReadAt || null);
      }
    )
    .subscribe();
  return channel;
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
              `----> Realtime: New message in selected room ${selectedRoom}, marking as read.`
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
