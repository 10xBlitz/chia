import { useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/types";

export function useChatRoomsRealtime(
  onNewMessage: (roomId: string, messageCreatedAt?: string) => void
) {
  useEffect(() => {
    const channel = supabaseClient
      .channel("chat-rooms-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
        },
        (payload) => {
          const msg = payload.new as Tables<"message">;
          if (msg?.chat_room_id) {
            onNewMessage(msg.chat_room_id, msg.created_at);
          }
        }
      )
      .subscribe();
    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [onNewMessage]);
}
