import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FetchedMessage } from "@/lib/supabase/services/messages.services";

/**
 * Subscribes to new messages in a room using Supabase realtime (postgres_changes).
 * Calls onNewMessage with the new message object when a new message is inserted.
 */
export function useMessagesRealtime(
  roomId: string | null,
  onNewMessage: (msg: FetchedMessage) => void
) {
  useEffect(() => {
    if (!roomId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages-realtime-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("---> New message payload:", payload);
          if (payload.new) {
            const msg = payload.new;
            // Transform to FetchedMessage shape
            const fetched: FetchedMessage = {
              id: msg.id,
              content: msg.content,
              user: {
                name: msg.sender_full_name || "Unknown Sender", // sender_full_name must be selected in the trigger or view
                id: msg.sender_id,
              },
              created_at: msg.created_at,
            };
            onNewMessage(fetched);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, onNewMessage]);
}
