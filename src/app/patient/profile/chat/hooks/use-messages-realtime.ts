import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FetchedMessage } from "@/lib/supabase/services/messages.services";
import { useChatRoomStore } from "@/stores/chat-room-store";
import { getUserById } from "@/lib/supabase/services/users.services";

/**
 * Subscribes to new messages in a room using Supabase realtime (postgres_changes).
 * Calls onNewMessage with the new message object when a new message is inserted.
 */
export function useMessagesRealtime(
  roomId: string | null,
  onNewMessage: (msg: FetchedMessage) => void
) {
  const setRecipient = useChatRoomStore((s) => s.setRecipient);
  const recipient = useChatRoomStore((s) => s.recipient);
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
        async (payload) => {
          console.log("---> New message payload:", payload);
          let recipientName = recipient?.name;
          if (payload.new) {
            if (!recipient) {
              const fetchedRecipient = await getUserById(payload.new.sender_id);
              setRecipient({
                id: fetchedRecipient.id,
                name: fetchedRecipient.full_name || "Unknown Recipient",
              });
              recipientName = fetchedRecipient.full_name || "Unknown Recipient";
            }

            //fetch the room to get the username
            const msg = payload.new;
            // Transform to FetchedMessage shape
            const fetched: FetchedMessage = {
              id: msg.id,
              content: msg.content,
              user: {
                name: recipientName || "Unknown Sender", // sender_full_name must be selected in the trigger or view
                id: msg.sender_id,
              },
              created_at: msg.created_at,
            };

            console.log("New message fetched:", fetched);
            // Call the callback with the new message
            onNewMessage(fetched);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, onNewMessage, setRecipient, recipient]);
}
