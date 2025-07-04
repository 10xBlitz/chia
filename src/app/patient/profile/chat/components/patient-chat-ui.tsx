"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePatientMessages } from "../hooks/use-patient-messages";
import { useMessagesRealtime } from "../hooks/use-messages-realtime";
import { insertMessage } from "@/lib/supabase/services/messages.services";
import { Input } from "@/components/ui/input";
import { FetchedMessage } from "@/lib/supabase/services/messages.services";
import { updateRoom } from "@/lib/supabase/services/room.services";
import { useChatRoomStore } from "@/stores/chat-room-store";
import { useUserStore } from "@/providers/user-store-provider";

interface PatientChatUIProps {
  roomId: string;
  currentUserId: string;
}

export function PatientChatUI({ roomId, currentUserId }: PatientChatUIProps) {
  const [input, setInput] = useState("");
  const [realtimeMessages, setRealtimeMessages] = useState<FetchedMessage[]>(
    []
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recipient = useChatRoomStore((s) => s.recipient);
  const setRecipient = useChatRoomStore((s) => s.setRecipient);
  const loggedInUserName = useUserStore(
    (s) => s.user?.full_name || "Unknown User"
  );

  // Infinite messages query
  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    usePatientMessages(roomId);

  // Flatten and reverse for chat order (latest at bottom)
  const messages = useMemo(() => {
    const dbMessages = ((data?.pages.flat() as FetchedMessage[]) || []).map(
      (msg) => ({
        ...msg,
        isRealtime: false,
      })
    );
    const all = [...dbMessages, ...realtimeMessages];
    // Remove duplicates by id
    const unique = all.filter(
      (msg, idx, arr) => idx === arr.findIndex((m) => m.id === msg.id)
    );
    // Sort so latest is at the bottom (ascending order)
    return unique.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [data, realtimeMessages]);

  // Scroll to bottom on new messages or room change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentUserId, recipient?.name, setRecipient]);

  // Realtime: listen for new messages in this room
  useMessagesRealtime(roomId, async (msg) => {
    setRealtimeMessages((prev) =>
      prev.some((m) => m.id === msg.id)
        ? prev
        : [
            ...prev,
            {
              ...msg,
              isRealtime: true,
            },
          ]
    );
    // refetch();

    //update the last_patient_read_at timestamp
    await updateRoom(roomId, {
      last_user_read_at: msg.created_at,
    });
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !roomId) return;
    const newMsg = await insertMessage({
      chat_room_id: roomId,
      content: input,
      sender_id: currentUserId,
    });
    setInput("");
    if (newMsg) {
      setRealtimeMessages((prev) =>
        prev.some((m) => m.id === newMsg.id)
          ? prev
          : [
              ...prev,
              {
                ...newMsg,
                isRealtime: true,
                user: {
                  id: currentUserId,
                  name: loggedInUserName || "Me", // "Me" in Korean, or use your user's display name if available
                },
              },
            ]
      );
    }
    // scrollToBottom will be triggered by useEffect on messages.length
  };

  return (
    <section className="flex flex-col flex-1 h-full min-h-0 bg-white">
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b font-semibold text-lg bg-white sticky top-0 z-10">
        채팅 {/* Chat */}
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
        {hasNextPage && (
          <button
            className="block mx-auto mb-4 px-4 py-1 rounded bg-gray-200 text-xs text-gray-700 hover:bg-gray-300"
            onClick={() => fetchNextPage()}
            disabled={isFetching}
          >
            더 보기 {/* Load more */}
          </button>
        )}
        {isLoading ? (
          <div className="text-gray-400 text-center">Loading...</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.user.id === currentUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-3 py-2 max-w-xs break-words shadow-sm text-sm ${
                  msg.user.id === currentUserId
                    ? "bg-blue-100 text-blue-900"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <span className="block font-medium mb-1 text-xs opacity-70">
                  {msg.user.name}
                </span>
                {msg.content}
                <span className="block text-[10px] text-right opacity-50 mt-1">
                  {new Date(msg.created_at).toLocaleString("ko-KR", {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input */}
      <form
        className="flex items-center gap-2 border-t p-3 bg-white sticky bottom-0 z-10"
        onSubmit={handleSend}
      >
        <Input
          className="flex-1 rounded border px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-400"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..." // Enter a message...
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          disabled={!input.trim()}
        >
          전송 {/* Send */}
        </button>
      </form>
    </section>
  );
}
