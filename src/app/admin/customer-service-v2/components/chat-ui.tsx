"use client";
import React, { useRef, useEffect, useCallback } from "react";
import { useInfiniteMessages } from "../hooks/use-infinite-messages";
import { useMessagesRealtime } from "../hooks/use-messages-realtime";
import {
  FetchedMessage,
  insertMessage,
} from "@/lib/supabase/services/messages.services";

interface ChatMessage {
  id: string;
  user: { id: string; name: string };
  content: string;
  createdAt: string;
}

interface ChatUIProps {
  roomId: string | null;
  currentUserId: string;
}

export function ChatUI({ roomId, currentUserId }: ChatUIProps) {
  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Infinite messages query
  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, refetch } =
    useInfiniteMessages(roomId);

  // Flatten and reverse for chat order (oldest at top)
  const messages: ChatMessage[] = (data?.pages.flat() || [])
    .map((msg: FetchedMessage) => ({
      id: msg.id,
      user: { id: msg.user.id, name: msg.user.name },
      content: msg.content,
      createdAt: msg.created_at,
    }))
    .reverse();

  // Scroll to bottom on new messages or room change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime: refetch on new message in this room
  useMessagesRealtime(
    roomId,
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !roomId) return;
    await insertMessage({
      chat_room_id: roomId,
      content: input,
      sender_id: currentUserId, // This should be the user's id, not display name
    });
    setInput("");
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
                  {new Date(msg.createdAt).toLocaleTimeString("ko-KR", {
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
        <input
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
