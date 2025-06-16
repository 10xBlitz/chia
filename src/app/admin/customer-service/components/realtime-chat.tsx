"use client";

import { cn } from "@/lib/utils";
import { type ChatMessage, useRealtimeChat } from "../hooks/use-realtime-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChatScroll } from "../hooks/use-chat-scroll";
import { ChatMessageItem } from "./chat-message";

interface RealtimeChatProps {
  roomName: string;
  username: string;
  onMessage?: (message: string) => void;
  messages?: ChatMessage[];
  fetchPrevMessages?: () => void;
  hasMorePrev?: boolean;
  isFetchingPrev?: boolean;
  lastPatientReadAt?: string | null; // For message status
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
  fetchPrevMessages,
  hasMorePrev,
  isFetchingPrev,
  lastPatientReadAt,
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
  const [sendingStatus, setSendingStatus] = useState<
    "idle" | "sending" | "delivered"
  >("idle");

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
      a.createdAt.localeCompare(b.createdAt)
    );

    return sortedMessages;
  }, [initialMessages, realtimeMessages]);

  // Track sending/delivered status for last own message
  useEffect(() => {
    if (!allMessages.length) return;
    const lastMsg = allMessages[allMessages.length - 1];
    if (lastMsg.user.name === username) {
      // If the last message is in realtimeMessages, it's delivered
      const isDelivered = realtimeMessages.some((m) => m.id === lastMsg.id);
      setSendingStatus(isDelivered ? "delivered" : "sending");
    } else {
      setSendingStatus("idle");
    }
  }, [allMessages, realtimeMessages, username]);

  // Scroll to bottom when a new message is appended (not when loading old messages)
  const prevLastMessageIdRef = useRef<string | undefined>(undefined);
  const prevMessagesLengthRef = useRef<number>(0);
  useEffect(() => {
    if (allMessages.length === 0) return;
    const lastMessage = allMessages[allMessages.length - 1];
    const prevLastId = prevLastMessageIdRef.current;
    const prevLen = prevMessagesLengthRef.current;
    // Only scroll if a new message is appended (not when fetching old messages)
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
    createdAt: new Date().toISOString(),
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

  return (
    <div className="flex flex-col max-h-full min-h-full w-full text-foreground antialiased bg-sidebar rounded-md">
      {/* Header */}
      <div className="flex items-center px-4 py-4 rounded-t-3xl border-b">
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
        className="flex-1 overflow-y-auto flex flex-col items-center px-4 pt-6 pb-2"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center mb-2">
          <div className="w-16 h-16 rounded-full p-10 flex items-center justify-center text-2xl font-bold mb-2 border border-[#D6E6FF]">
            Chia!
          </div>
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
            if (
              isLastOwnMessage &&
              lastPatientReadAt &&
              new Date(message.createdAt) <= new Date(lastPatientReadAt)
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
                  forceStatus={isLastOwnMessage ? forceStatus : undefined}
                  sendingStatus={isLastOwnMessage ? sendingStatus : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-5">
        <ChatForm
          handleSendMessage={handleSendMessage}
          isConnected={isConnected}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
        />
      </div>
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
