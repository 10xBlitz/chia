"use client";
import { useChatRoomStore } from "@/stores/chat-room-store";
import { useUserStore } from "@/providers/user-store-provider";
import { PatientChatSidebar } from "./components/patient-chat-sidebar";
import { PatientChatUI } from "./components/patient-chat-ui";

export default function PatientChatPage() {
  const userId = useUserStore((s) => s.user?.id || "");
  const selectedRoomId = useChatRoomStore((s) => s.room?.id);
  const setSelectedRoom = useChatRoomStore((s) => s.setRoom);

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50">
      {/* Only sidebar if no room selected */}
      {!selectedRoomId && (
        <PatientChatSidebar setRoom={(id) => setSelectedRoom(id)} />
      )}
      {/* Only chat UI if room selected */}
      {selectedRoomId && (
        <main className="w-full h-full flex flex-col">
          <div className="h-14 flex items-center px-2 border-b bg-white">
            <button
              className="mr-2 px-2 py-1 rounded hover:bg-gray-100"
              onClick={() => setSelectedRoom(null)}
              aria-label="뒤로가기" // Back
            >
              &larr;
            </button>
            <span className="font-semibold text-lg">채팅 {/* Chat */}</span>
          </div>
          <PatientChatUI roomId={selectedRoomId} currentUserId={userId} />
        </main>
      )}
    </div>
  );
}
