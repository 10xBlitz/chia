"use client";

import { cn } from "@/lib/utils";
import { type ChatMessage, useRealtimeChat } from "../hooks/use-realtime-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useChatScroll } from "../hooks/use-chat-scroll";
import { ChatMessageItem } from "./chat-message";
import BackButton from "@/components/back-button";

interface RealtimeChatProps {
  roomName: string;
  username: string;
  onMessage?: (message: string) => void;
  messages?: ChatMessage[];
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
      a.createdAt.localeCompare(b.createdAt)
    );

    return sortedMessages;
  }, [initialMessages, realtimeMessages]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
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

  // System message content and object
  const systemMessageContent = [
    "안녕하세요, 고객님",
    "치아 1:1 채팅 고객센터입니다.",
    "",
    "궁금하신 사항을 선택해 주세요.",
    "해당하는 문의가 없는 경우에는 [기타]를 선택해 주세요.",
    "",
    "운영시간 (토,일, 공휴일 제외)",
    "- 월~금 : 10:00 ~ 18:00",
    "- 점심시간 : 13:00 ~ 14:00",
  ].join("\n");

  const systemMessage = {
    id: "system-welcome",
    content: systemMessageContent,
    user: { name: "치아" },
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="flex flex-col h-full w-full text-foreground antialiased">
      {/* Header */}
      <div className="flex items-center px-6 py-4 bg-white rounded-t-3xl">
        <BackButton className="" />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E6F0FF] flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">Chia!</span>
          </div>
          <span className="font-semibold text-xl text-black">치아</span>
        </div>
      </div>
      {/* Chat area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex flex-col items-center px-4 pt-6 pb-2"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center mb-2">
          <div className="w-16 h-16 rounded-full p-10 flex items-center justify-center text-blue-600 text-2xl font-bold mb-2 border border-[#D6E6FF]">
            Chia!
          </div>
          <div className="font-semibold text-base mb-1">Contact 치아</div>
          <div className="text-xs text-muted-foreground mb-4">1:18 PM</div>
        </div>
        {/* System welcome message using ChatMessageItem */}
        <div className="w-full flex justify-start mb-2">
          <ChatMessageItem
            message={systemMessage}
            isOwnMessage={false}
            showHeader={true}
          />
        </div>
        {/* User & other messages */}
        <div className="w-full space-y-1">
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null;
            const showHeader =
              !prevMessage || prevMessage.user.name !== message.user.name;

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showHeader={showHeader}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Input only, no options */}
      <form
        onSubmit={handleSendMessage}
        className="flex w-full gap-2 border-t border-border bg-white p-4"
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
    </div>
  );
};
