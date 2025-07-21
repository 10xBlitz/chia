"use client";
import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { useInfiniteMessages } from "../hooks/use-infinite-messages";
import { useMessagesRealtime } from "../hooks/use-messages-realtime";
import {
  FetchedMessage,
  insertMessage,
} from "@/lib/supabase/services/messages.services";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useRoomSelectionStore } from "../room-selection-context";
import { useUserStore } from "@/providers/user-store-provider";

interface ChatMessage {
  id: string;
  user: { id: string; name: string };
  content: string;
  createdAt: string;
  status?: "sending" | "sent" | "failed"; // 전송상태: 전송중, 전송완료, 전송실패 (Message status: sending, sent, failed)
  isOptimistic?: boolean; // 낙관적 업데이트 여부 (Whether this is an optimistic update)
}

interface ChatUIProps {
  roomId: string | null;
  currentUserId: string;
}

export function ChatUI({ roomId, currentUserId }: ChatUIProps) {
  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const memoizedRoomId = useMemo(() => roomId, [roomId]);
  const isLoadingMore = useRef(false);
  const userName =
    useUserStore((selector) => selector.user?.full_name) || "관리자"; // Fallback to "관리자" if user name is not available

  // 낙관적 메시지 상태 관리 (Optimistic message state management)
  const [optimisticMessages, setOptimisticMessages] = React.useState<
    ChatMessage[]
  >([]);

  // Get current room user name from the store
  const currentRoomUserName = useRoomSelectionStore(
    (s) => s.currentRoomUserName
  );

  // Infinite messages query
  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    useInfiniteMessages(roomId);

  // Get query client for cache updates
  const queryClient = useQueryClient();

  // Flatten and reverse for chat order (oldest at top, newest at bottom)
  const dbMessages: ChatMessage[] = (data?.pages.flat() || [])
    .map((msg: FetchedMessage) => ({
      id: msg.id,
      user: { id: msg.user.id, name: msg.user.name },
      content: msg.content,
      createdAt: msg.created_at,
      status: "sent" as const, // 데이터베이스에서 온 메시지는 전송완료 상태 (Messages from database are sent)
      isOptimistic: false,
    }))
    .reverse(); // Reverse so newest is at the bottom

  // 데이터베이스 메시지와 낙관적 메시지 결합 (Combine database messages with optimistic messages)
  const messages: ChatMessage[] = [...dbMessages, ...optimisticMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Scroll to bottom on new messages or room change (but not when loading more)
  useEffect(() => {
    if (memoizedRoomId === null || isLoadingMore.current) return; // Don't scroll if no room or loading more
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, memoizedRoomId]);

  // Reset loading more flag when not fetching
  useEffect(() => {
    if (!isFetching) {
      isLoadingMore.current = false;
    }
  }, [isFetching]);

  // 방 변경 시 낙관적 메시지 초기화 (Clear optimistic messages when room changes)
  useEffect(() => {
    setOptimisticMessages([]);
  }, [roomId]);

  // Realtime: update optimistic messages or add new messages
  useMessagesRealtime(
    roomId,
    useCallback(
      (rawMessage) => {
        if (!roomId) return;

        // 실시간 메시지와 일치하는 낙관적 메시지를 찾아서 상태만 업데이트 (Find matching optimistic message and update status only)
        const matchingOptimisticIndex = optimisticMessages.findIndex(
          (optimisticMsg) =>
            optimisticMsg.content === rawMessage.content &&
            optimisticMsg.user.id === rawMessage.sender_id &&
            Math.abs(
              new Date(optimisticMsg.createdAt).getTime() -
                new Date(rawMessage.created_at).getTime()
            ) < 10000 // 10초 이내 (within 10 seconds)
        );

        if (matchingOptimisticIndex !== -1) {
          // 일치하는 낙관적 메시지가 있으면 상태를 업데이트하고 실제 ID로 변경 (If matching optimistic message exists, update status and change to real ID)
          setOptimisticMessages((prev) =>
            prev.map((msg, index) =>
              index === matchingOptimisticIndex
                ? {
                    ...msg,
                    id: rawMessage.id,
                    status: "sent" as const,
                    isOptimistic: false,
                  }
                : msg
            )
          );
          return; // 낙관적 메시지를 업데이트했으므로 캐시에 추가하지 않음 (Updated optimistic message, so don't add to cache)
        }

        // Determine the user name based on sender ID
        const getUserName = (senderId: string) => {
          if (senderId === currentUserId) {
            return userName; // Admin
          } else {
            return currentRoomUserName || "환자"; // Patient name from room store, fallback to "Patient"
          }
        };

        // Convert raw message to FetchedMessage format with proper user info
        const newMessage: FetchedMessage = {
          id: rawMessage.id,
          content: rawMessage.content,
          created_at: rawMessage.created_at,
          user: {
            id: rawMessage.sender_id,
            name: getUserName(rawMessage.sender_id),
          },
        };

        // 낙관적 메시지가 없는 경우에만 캐시에 새 메시지 추가 (Only add new message to cache if no optimistic message exists)
        queryClient.setQueryData(
          ["messages", roomId],
          (oldData: { pages: FetchedMessage[][] } | undefined) => {
            if (!oldData?.pages) return oldData;

            const firstPage = oldData.pages[0] || [];
            const messageExists = firstPage.some(
              (msg: FetchedMessage) => msg.id === newMessage.id
            );

            if (messageExists) return oldData; // Message already exists

            return {
              ...oldData,
              pages: [
                [newMessage, ...firstPage], // Add to first page (newest messages)
                ...oldData.pages.slice(1),
              ],
            };
          }
        );
      },
      [
        roomId,
        queryClient,
        currentUserId,
        currentRoomUserName,
        userName,
        optimisticMessages,
      ]
    )
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !roomId) return;

    const messageContent = input.trim();
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const now = new Date().toISOString();

    // 낙관적 메시지 생성 (Create optimistic message)
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      user: { id: currentUserId, name: userName },
      content: messageContent,
      createdAt: now,
      status: "sending", // 전송중 (Sending)
      isOptimistic: true,
    };

    // UI에 즉시 메시지 추가 (Add message to UI immediately)
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    setInput(""); // 입력창 즉시 비우기 (Clear input immediately)

    try {
      // 데이터베이스에 메시지 저장 시도 (Attempt to save message to database)
      await insertMessage({
        chat_room_id: roomId,
        content: messageContent,
        sender_id: currentUserId,
      });

      // 성공 시 낙관적 메시지를 전송완료로 업데이트 (On success, update optimistic message to sent)
      setOptimisticMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticId ? { ...msg, status: "sent" as const } : msg
        )
      );

      // 낙관적 메시지는 실시간 업데이트에서 자동으로 제거됨 (Optimistic message will be automatically removed by real-time update)
    } catch (error) {
      console.error("메시지 전송 실패:", error); // Failed to send message

      // 실패 시 낙관적 메시지를 전송실패로 업데이트 (On failure, update optimistic message to failed)
      setOptimisticMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticId ? { ...msg, status: "failed" as const } : msg
        )
      );
    }
  };

  // Helper: detect mobile
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 메시지 상태 표시 함수 (Message status indicator function)
  const renderMessageStatus = (status?: ChatMessage["status"]) => {
    if (!status || status === "sent") {
      // 전송완료 상태에도 작은 체크 표시 (Show small check mark for sent status)
      return (
        <span className="text-[9px] text-green-500 ml-1 flex items-center gap-0.5">
          <span className="w-1 h-1 bg-green-500 rounded-full"></span>
          전송된 {/* Sent */}
        </span>
      );
    }

    switch (status) {
      case "sending":
        return (
          <span className="text-[9px] text-yellow-500 ml-1 flex items-center gap-0.5">
            <span className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse"></span>
            전송중... {/* Sending... */}
          </span>
        );
      case "failed":
        return (
          <span className="text-[9px] text-red-500 ml-1 flex items-center gap-0.5">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            전송실패 {/* Failed to send */}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="flex flex-col flex-1 h-full min-h-0 bg-white max-h-[100dvh] overflow-y-hidden">
      {/* Header (hide on mobile) */}
      {!isMobile && (
        <div className="h-14 flex items-center px-4 border-b font-semibold text-lg bg-white sticky top-0 z-10">
          채팅 {/* Chat */}
        </div>
      )}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
        {hasNextPage && (
          <div className=" top-10 z-10 flex justify-center py-2 bg-white">
            <Button
              className="px-4 py-1 rounded bg-gray-200 text-xs text-gray-700 hover:bg-gray-300"
              onClick={() => {
                isLoadingMore.current = true;
                fetchNextPage();
              }}
              disabled={isFetching}
            >
              더 보기 {/* Load more */}
            </Button>
          </div>
        )}

        {/**This is added so that the last message is visible */}
        {!hasNextPage && (
          <div className="sticky top-0 z-10 flex justify-center py-8 bg-white"></div>
        )}
        {isLoading ? (
          <div className="text-gray-400 text-center">
            로딩 중... {/**Loading... */}
          </div>
        ) : (
          <div
            className={`space-y-2 overflow-y-hidden ${
              hasNextPage ? "pt-12" : ""
            }`}
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  layout
                  className={`flex ${
                    msg.user.id === currentUserId
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-xs break-words shadow-sm text-sm ${
                      msg.user.id === currentUserId
                        ? "bg-blue-100 text-blue-900"
                        : "bg-gray-100 text-gray-900"
                    } ${
                      msg.status === "failed" ? "border border-red-200" : ""
                    }`}
                  >
                    <span className="block font-medium mb-1 text-xs opacity-70">
                      {msg.user.name}
                    </span>
                    {msg.content}
                    <div className="flex items-center justify-between mt-1">
                      <span className="block text-[10px] text-right opacity-50">
                        {new Date(msg.createdAt).toLocaleString("ko-KR", {
                          year: "2-digit",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {renderMessageStatus(msg.status)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
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
