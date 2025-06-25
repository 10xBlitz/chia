"use client";
import React from "react";
import { ChatSidebar } from "./components/chat-sidebar";
import { ChatUI } from "./components/chat-ui";
import { useUserStore } from "@/providers/user-store-provider";
import { useRoomSelectionStore } from "./room-selection-context";

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function CustomerServiceV2Page() {
  const currentRoomId = useRoomSelectionStore((s) => s.currentRoomId);
  const currentUserId = useUserStore((selector) => selector.user?.id); // Admin
  const isMobile = useIsMobile();

  // If no user is logged in, show a message
  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-[100dvh] w-full bg-gray-100">
        <p className="text-gray-500">로그인 후 이용해주세요.</p>
        {/* Please log in to use the service */}
      </div>
    );
  }

  // Mobile: show sidebar or chat, not both
  if (isMobile) {
    if (!currentRoomId) {
      return (
        <div className="h-[100dvh] w-full bg-gray-100 mt-5">
          <ChatSidebar />
        </div>
      );
    }
    return (
      <div className="h-[100dvh] w-full bg-gray-100 flex flex-col  mt-5">
        <div className="flex-1 min-h-0 flex flex-col">
          <ChatUI roomId={currentRoomId} currentUserId={currentUserId} />
        </div>
      </div>
    );
  }

  // Desktop: show sidebar and chat
  return (
    <div className="flex h-[100dvh] w-full bg-gray-100">
      <ChatSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <ChatUI roomId={currentRoomId} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
