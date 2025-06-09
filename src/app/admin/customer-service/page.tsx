"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { useUserStore } from "@/providers/user-store-provider";
import { RealtimeChat } from "../../patient/profile/chat/components/realtime-chat";
import { ChatMessage } from "../../patient/profile/chat/hooks/use-realtime-chat";
import { Button } from "@/components/ui/button";

export default function CustomerServiceChatListener() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [openRooms, setOpenRooms] = useState<
    { person_name: string; room_id: string }[]
  >([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const user = useUserStore((state) => state.user);

  // Fetch all open chat rooms
  useEffect(() => {
    const fetchOpenRooms = async () => {
      const { data } = await supabaseClient
        .from("chat_room")
        .select("id, user!patient_id(full_name), category")
        .order("created_at", { ascending: false });
      setOpenRooms(
        data?.map((room) => ({
          person_name: room.user?.full_name || "no name",
          room_id: room.id,
          category: room.category,
        })) || []
      );
    };
    fetchOpenRooms();
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    const loadMessages = async () => {
      const { data } = await supabaseClient
        .from("message")
        .select("*, sender:sender_id(full_name)")
        .eq("chat_room_id", selectedRoom)
        .order("created_at", { ascending: true });

      const formattedMessages =
        data?.map((msg) => ({
          id: msg.id,
          content: msg.content,
          user: { name: msg.sender.full_name },
          createdAt: msg.created_at,
        })) || [];

      setMessages(formattedMessages);
    };

    loadMessages();
  }, [selectedRoom]);

  // Send a reply to the selected chat room
  const sendMessage = async (message: string) => {
    const user = (await supabaseClient.auth.getUser()).data.user;
    if (!user || !message.trim() || !selectedRoom) return;

    await supabaseClient.from("message").insert([
      {
        content: message.trim(),
        chat_room_id: selectedRoom,
        sender_id: user.id,
      },
    ]);
  };

  return user?.role !== "admin" ? (
    <div>You are not authorized</div>
  ) : (
    <div className="flex h-screen">
      {/* Sidebar: List of open chat rooms */}
      <aside className="w-64 bg-gray-100 border-r p-4">
        <h2 className="font-bold mb-4">Open Chat Rooms</h2>
        <ul className="flex flex-col gap-3">
          {openRooms.map((room) => (
            <li key={room.room_id}>
              <Button
                className={`w-full btn-primary text-left px-2 py-1 rounded ${
                  selectedRoom === room.room_id
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-100"
                }`}
                onClick={() => setSelectedRoom(room.room_id)}
              >
                Room: {room.person_name}
              </Button>
            </li>
          ))}
        </ul>
      </aside>
      {/* Main: Chat messages */}

      {selectedRoom && (
        <RealtimeChat
          roomName={selectedRoom}
          username={user?.full_name} // You can use the user's name here
          messages={messages}
          onMessage={sendMessage}
          onSelectRoomCategory={() => {}}
        />
      )}
    </div>
  );
}
