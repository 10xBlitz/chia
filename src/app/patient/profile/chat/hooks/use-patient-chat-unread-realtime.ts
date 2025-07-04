/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchUnreadMessageCountOfRoom } from "@/lib/supabase/services/messages.services";
import { fetchRooms } from "@/lib/supabase/services/room.services";

/**
 * Custom hook to subscribe to unread message counts for patient chat rooms in real time.
 * Calls setUnreadCounts with updated counts keyed by chat_room_id.
 * Listens only to messages in rooms owned by the user (patient_id = userId).
 */
export function usePatientChatUnreadRealtime(
  userId: string,
  setUnreadCounts: (
    updater: (prev: Record<string, number>) => Record<string, number>
  ) => void
) {
  useEffect(() => {
    if (!userId) return;
    let channel: any;
    let supabase: any;
    let isMounted = true;
    (async () => {
      // Fetch all room ids and last_user_read_at for this user
      const rooms = await fetchRooms({ patient_id: userId });
      // Map: roomId -> last_user_read_at
      const roomLastRead: Record<string, string> = {};
      const roomIds = (rooms || []).map(
        (r: { id: string; last_user_read_at?: string | null }) => {
          roomLastRead[r.id] = r.last_user_read_at || "";
          return r.id;
        }
      );
      if (!roomIds.length) return;
      supabase = createClient();
      channel = supabase
        .channel(`patient-chat-unread-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "message",
            filter: `chat_room_id=in.(${roomIds.join(",")})`,
          },
          async (payload: any) => {
            const msg = payload.new;
            console.log("--->new message payload:", msg);
            if (msg && msg.chat_room_id) {
              // Use last_user_read_at from the room as the reference
              const lastRead = roomLastRead[msg.chat_room_id] || "";
              const count = await fetchUnreadMessageCountOfRoom(
                userId,
                msg.chat_room_id,
                lastRead
              );
              if (isMounted) {
                setUnreadCounts((prev) => ({
                  ...prev,
                  [rooms.find((item) => item.id === msg.chat_room_id)
                    ?.category as string]: count,
                }));
              }
            }
          }
        )
        .subscribe();
    })();
    return () => {
      isMounted = false;
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [userId, setUnreadCounts]);
}
