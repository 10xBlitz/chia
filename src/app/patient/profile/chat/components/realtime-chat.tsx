"use client";

import { cn } from "@/lib/utils";
import { type ChatMessage, useRealtimeChat } from "../hooks/use-realtime-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChatScroll } from "../hooks/use-chat-scroll";
import { ChatMessageItem } from "./chat-message";
import BackButton from "@/components/back-button";
import Image from "next/image";

interface RealtimeChatProps {
  roomName: string;
  username: string;
  onMessage?: (message: string) => void;
  messages?: ChatMessage[];
  onSelectRoomCategory: (roomCategory: string | undefined) => Promise<void>;
  fetchPrevMessages?: () => void;
  hasMorePrev?: boolean;
  isFetchingPrev?: boolean;
  unreadByCategory?: Record<string, number>;
  sendError?: string | null;
  sendingStatus?: "idle" | "sending" | "delivered";
  lastSentMessage?: string;
  adminLastReadAt?: string | null;
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
  onSelectRoomCategory,
  fetchPrevMessages,
  hasMorePrev,
  isFetchingPrev,
  unreadByCategory = {},
  sendError,
  sendingStatus,
  adminLastReadAt,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
  });
  const [newMessage, setNewMessage] = useState("");

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages];
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id)
    );

    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );

    return sortedMessages;
  }, [initialMessages, realtimeMessages]);

  const prevLastMessageIdRef = useRef<string | undefined>(undefined);
  const prevMessagesLengthRef = useRef<number>(0);

  useEffect(() => {
    if (allMessages.length === 0) return;
    const lastMessage = allMessages[allMessages.length - 1];
    const prevLastId = prevLastMessageIdRef.current;
    const prevLen = prevMessagesLengthRef.current;
    // Only scroll if a new message is appended (not prepended)
    if (
      prevLen > 0 &&
      allMessages.length > prevLen &&
      lastMessage.id !== prevLastId
    ) {
      scrollToBottom();
    }
    prevLastMessageIdRef.current = lastMessage.id;
    prevMessagesLengthRef.current = allMessages.length;
  }, [allMessages, scrollToBottom]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !isConnected) return;

      if (onMessage) {
        onMessage(newMessage);
      }
      sendMessage(newMessage);
      setNewMessage("");
    },
    [newMessage, isConnected, sendMessage, onMessage]
  );

  const systemMessage = {
    id: "system-message",
    content: `안녕하세요, 고객님
                          치아 1:1 채팅 고객센터입니다.

                          궁금하신 사항을 선택해 주세요.
                          해당하는 문의가 없는 경우에는 [기타]를
                          선택해 주세요.

                          운영시간 (토,일. 공휴일 제외)
                          - ﻿월~ 금 : 10:00 ~ 18:00
                          - 점심시간 : 13:00 ~ 14:00`,
    user: { name: "고객센터" }, // Customer Service
    created_at: new Date().toISOString(),
  };

  // Infinite scroll: load more when scrolled to top
  useEffect(() => {
    if (!fetchPrevMessages || !hasMorePrev) return;
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMorePrev && !isFetchingPrev) {
        fetchPrevMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [fetchPrevMessages, hasMorePrev, isFetchingPrev, containerRef]);

  const categories = [
    "회원/계정",
    "후기 관리",
    "상담 신청",
    "앱결제",
    "오류",
    "기타",
  ];

  return (
    <div className="flex flex-col h-dvh pb-5 w-full text-foreground antialiased">
      {/* Header */}
      <div className="flex items-center px-4 py-4 bg-white rounded-t-3xl">
        {roomName === "no room" ? (
          <BackButton />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => onSelectRoomCategory(undefined)}
          >
            <Image
              src="/icons/chevron-left.svg"
              alt="back"
              height={20}
              width={12}
            />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E6F0FF] flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">Chia!</span>
          </div>
          <span className="font-semibold text-xl text-black">
            치아 {/**Teeth */}
          </span>
        </div>
      </div>
      {/* Chat area */}
      <div
        ref={containerRef}
        className="flex-1  overflow-y-auto flex flex-col items-center px-4 pt-6 pb-2"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center mb-2">
          <div className="w-16 h-16 rounded-full p-10 flex items-center justify-center text-2xl font-bold mb-2 border border-[#D6E6FF]">
            Chia!
          </div>
          <div className="font-semibold text-base mb-1">Contact 치아</div>
          <div className="text-xs text-muted-foreground mb-4">1:18 PM</div>
        </div>

        {/**System message if there is no room yet */}
        {roomName === "no room" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ChatMessageItem
              message={systemMessage}
              isOwnMessage={false}
              showHeader={true}
            />
          </div>
        )}

        {/* User & other messages */}
        <div className="w-full space-y-1">
          {hasMorePrev && (
            <div className="w-full flex justify-center mb-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isFetchingPrev}
                onClick={fetchPrevMessages}
              >
                {isFetchingPrev ? "Loading..." : "Load previous messages"}
              </Button>
            </div>
          )}
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null;
            const showHeader =
              !prevMessage || prevMessage.user.name !== message.user.name;

            // Only show status on the last own message
            const isLastOwnMessage =
              message.user.name === username &&
              index === allMessages.length - 1;

            let forceStatus: "seen" | undefined = undefined;
            // Only set status if this is the last own message
            if (
              isLastOwnMessage &&
              adminLastReadAt &&
              new Date(message.created_at) <= new Date(adminLastReadAt)
            ) {
              forceStatus = "seen";
            }

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showHeader={showHeader}
                  sendingStatus={isLastOwnMessage ? sendingStatus : undefined}
                  sendError={isLastOwnMessage ? sendError : undefined}
                  forceStatus={isLastOwnMessage ? forceStatus : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Input only, no options */}
      {roomName === "no room" ? (
        <div className="flex gap-3 flex-wrap justify-end">
          {categories.map((item) => (
            <Button
              variant="outline"
              key={item}
              onClick={() => onSelectRoomCategory(item)}
              className="relative"
            >
              {item}
              {unreadByCategory[item] > 0 && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full">
                  {unreadByCategory[item]}
                </span>
              )}
            </Button>
          ))}
        </div>
      ) : (
        <ChatForm
          handleSendMessage={handleSendMessage}
          isConnected={isConnected}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
        />
      )}
    </div>
  );
};

function ChatForm({
  handleSendMessage,
  isConnected,
  newMessage,
  setNewMessage,
}: {
  handleSendMessage: (e: React.FormEvent) => void;
  isConnected: boolean;
  newMessage: string;
  setNewMessage: (message: string) => void;
}) {
  return (
    <form
      onSubmit={handleSendMessage}
      className="flex w-full gap-2 border-t border-border  p-4"
    >
      <Input
        className={cn(
          "rounded-md bg-[#F7F7F9] text-sm transition-all duration-300 border-none focus:ring-0 focus:outline-none",
          isConnected && newMessage.trim() ? "w-[calc(100%-36px)]" : "w-full"
        )}
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={!isConnected}
      />
      {isConnected && newMessage.trim() && (
        <Button
          className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300 bg-blue-600 hover:bg-blue-700 text-white"
          type="submit"
          disabled={!isConnected}
        >
          <Send className="size-4" />
        </Button>
      )}
    </form>
  );
}
