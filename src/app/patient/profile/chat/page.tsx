"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RealtimeChat } from "./components/realtime-chat";
import { supabaseClient } from "@/lib/supabase/client";
import { ChatMessage } from "./hooks/use-realtime-chat";
import { useUserStore } from "@/providers/user-store-provider";

async function fetchChatRoom(userId?: string) {
  if (!userId) return undefined;
  const { data: chatRooms } = await supabaseClient
    .from("chat_room")
    .select("*")
    .eq("patient_id", userId)
    .limit(1);
  return chatRooms && chatRooms.length > 0 ? chatRooms[0] : undefined;
}

async function fetchMessages(chatRoomId?: string) {
  if (!chatRoomId) return [];
  const { data } = await supabaseClient
    .from("message")
    .select("*, user(full_name)")
    .eq("chat_room_id", chatRoomId)
    .limit(20)
    .order("created_at", { ascending: true });

  return (
    data?.map((msg) => ({
      id: msg.id,
      content: msg.content,
      user: { name: msg.user.full_name },
      createdAt: msg.created_at,
    })) || []
  );
}

async function createChatRoom(userId: string) {
  const { data: newRoom } = await supabaseClient
    .from("chat_room")
    .insert({ patient_id: userId })
    .select()
    .single();
  return newRoom;
}

async function sendMessageToRoom({
  message,
  chatRoomId,
  userId,
}: {
  message: string;
  chatRoomId: string;
  userId: string;
}) {
  if (!userId || !message.trim() || !chatRoomId) return;
  await supabaseClient
    .from("message")
    .insert([
      { content: message.trim(), user_id: userId, chat_room_id: chatRoomId },
    ]);
}

export default function ChatPage() {
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();
  const [creatingRoom, setCreatingRoom] = useState(false);

  // 1. Query for chat room
  const { data: chatRoom, isLoading: chatRoomLoading } = useQuery({
    queryKey: ["chatRoom", user?.id],
    queryFn: () => fetchChatRoom(user?.id),
    enabled: !!user,
  });

  // 2. Query for messages
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", chatRoom?.id],
    queryFn: () => fetchMessages(chatRoom?.id),
    enabled: !!chatRoom?.id,
  });

  // 3. Mutation to create chat room
  const createRoomMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("No user");
      return createChatRoom(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatRoom", user?.id] });
    },
    onSettled: () => setCreatingRoom(false),
  });

  // 4. Mutation to send message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user || !chatRoom?.id) return;
      await sendMessageToRoom({
        message,
        chatRoomId: chatRoom.id,
        userId: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", chatRoom?.id] });
    },
  });

  const handleCreateChatRoom = () => {
    setCreatingRoom(true);
    createRoomMutation.mutate();
  };

  const handleSendMessage = (message: string) => {
    sendMessageMutation.mutate(message);
  };

  if (chatRoomLoading) {
    return <div>Loading chat...</div>;
  }

  if (!chatRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="mb-6 text-gray-700 text-lg">채팅방이 없습니다.</p>
        <button
          onClick={handleCreateChatRoom}
          disabled={creatingRoom}
          className={`w-48 py-2 px-4 rounded-lg font-semibold transition 
          ${
            creatingRoom
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow"
          }`}
          style={{ minWidth: 160 }}
        >
          {creatingRoom ? "채팅방 생성 중..." : "채팅 시작하기"}
        </button>
      </div>
    );
  }

  return (
    <>
      <RealtimeChat
        roomName={chatRoom.id}
        username={user?.full_name || "no name"}
        messages={messages as ChatMessage[]}
        onMessage={handleSendMessage}
      />
    </>
  );
}
