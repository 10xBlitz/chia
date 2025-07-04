import { useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/types";

/**
 * Listen for new messages in a specific chat room and call the callback with the new message.
 * @param roomId The chat room ID to listen to
 * @param onNewMessage Callback for new message
 */
export function useMessagesRealtime(
  roomId: string | null,
  onNewMessage: (msg: Tables<"message">) => void
) {
  useEffect(() => {
    if (!roomId) return;
    const channel = supabaseClient
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
          onNewMessage(payload.new as Tables<"message">);
        }
      )
      .subscribe();
    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [roomId, onNewMessage]);
}
