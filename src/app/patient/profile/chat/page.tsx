"use client";
import { useEffect, useState } from "react";
import { RealtimeChat } from "./components/realtime-chat";
import { supabaseClient } from "@/lib/supabase/client";
import { ChatMessage } from "./hooks/use-realtime-chat";
import { useUserStore } from "@/providers/user-store-provider";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatRoomId, setChatRoomId] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingRoom, setCheckingRoom] = useState<boolean>(true);
  const user = useUserStore((state) => state.user);

  // 1. Only find an open chat room for the current user, do not auto-create
  useEffect(() => {
    const checkChatRoom = async () => {
      setCheckingRoom(true);
      if (!user) {
        setChatRoomId(undefined);
        setCheckingRoom(false);
        return;
      }
      const { data: chatRooms } = await supabaseClient
        .from("chat_room")
        .select("*")
        .eq("patient_id", user.id)
        .limit(1);

      const roomId =
        chatRooms && chatRooms.length > 0 ? chatRooms[0].id : undefined;
      setChatRoomId(roomId);
      setCheckingRoom(false);
    };
    checkChatRoom();
  }, [user]);

  // 2. Fetch messages for this chat room/ does not subscribe to changes
  useEffect(() => {
    if (!chatRoomId) return;

    const loadMessages = async () => {
      const { data } = await supabaseClient
        .from("message")
        .select("*, user(full_name)")
        .eq("chat_room_id", chatRoomId)
        .limit(20)
        .order("created_at", { ascending: true });

      const formattedMessages =
        data?.map((msg) => ({
          id: msg.id,
          content: msg.content,
          user: { name: msg.user.full_name },
          createdAt: msg.created_at,
        })) || [];

      setMessages(formattedMessages);
    };

    loadMessages();
  }, [chatRoomId]);

  // 3. Send a message to this chat room
  const sendMessage = async (message: string) => {
    const user = (await supabaseClient.auth.getUser()).data.user;
    if (!user || !message.trim() || !chatRoomId) return;

    await supabaseClient
      .from("message")
      .insert([
        { content: message.trim(), user_id: user.id, chat_room_id: chatRoomId },
      ]);
  };

  // 4. Handler to create a chat room
  const handleCreateChatRoom = async () => {
    if (!user) return;
    setLoading(true);
    const { data: newRoom } = await supabaseClient
      .from("chat_room")
      .insert({ patient_id: user.id })
      .select()
      .single();
    setChatRoomId(newRoom?.id);
    setLoading(false);
  };

  if (checkingRoom) {
    return <div>Loading chat...</div>;
  }

  if (!chatRoomId) {
    return (
      <div>
        <p>No open chat room found.</p>
        <button
          onClick={handleCreateChatRoom}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Creating..." : "Start Chat"}
        </button>
      </div>
    );
  }

  return (
    <>
      <RealtimeChat
        roomName={chatRoomId}
        username={user?.full_name || "no name"}
        messages={messages}
        onMessage={sendMessage}
      />
    </>
  );
}
