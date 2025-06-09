"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RealtimeChat } from "./components/realtime-chat";
import { supabaseClient } from "@/lib/supabase/client";
import { useUserStore } from "@/providers/user-store-provider";
import { useState } from "react";

export default function ChatPage() {
  const user = useUserStore((state) => state.user);
  const [roomCategory, setRoomCategory] = useState<string>();

  // 1. Query for chat room
  const { data: chatRoom, isLoading: chatRoomLoading } = useQuery({
    queryKey: ["chatRoom", user?.id, roomCategory],
    queryFn: async () =>
      await fetchChatRoom(user?.id as string, roomCategory as string),
    enabled: !!user?.id && !!roomCategory,
    retry: 1,
  });

  // 2. Query for messages, if there is no messages, create an initial message
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", chatRoom?.id],
    queryFn: async () => await fetchMessages(chatRoom?.id),
    enabled: !!chatRoom?.id && !!roomCategory,
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
  });

  if (chatRoomLoading) {
    return <div>Loading chat...</div>;
  }

  return (
    <>
      <RealtimeChat
        roomName={chatRoom?.id && roomCategory ? chatRoom.id : "no room"}
        username={user?.full_name || "no name"}
        messages={roomCategory ? messages : []}
        onMessage={(msg) => sendMessageMutation.mutate(msg)}
        onSelectRoomCategory={(rCategory) => setRoomCategory(rCategory)}
      />
    </>
  );
}

async function fetchChatRoom(userId: string, roomCategory: string) {
  const { data: chatRoom, error } = await supabaseClient
    .from("chat_room")
    .select("*")
    .eq("patient_id", userId)
    .eq("category", roomCategory)
    .maybeSingle();

  if (error) {
    throw new Error(`Error fetching chat room: ${error.message}`);
  }

  if (!chatRoom) {
    console.log("---> no chat room");
    // If no chat room exists, create a new one
    const newRoom = await createChatRoom(userId, roomCategory);
    console.log("---> new chat room created", newRoom);
    return newRoom;
  }

  console.log("---> chat room found", chatRoom);
  return chatRoom;
}

async function fetchMessages(chatRoomId?: string) {
  if (!chatRoomId) return [];
  const { data, error } = await supabaseClient
    .from("message")
    .select("*, sender:sender_id(full_name)")
    .eq("chat_room_id", chatRoomId)
    .limit(20)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Error fetching messages: ${error.message}`);
  }

  return (
    data?.map((msg) => ({
      id: msg.id,
      content: msg.content,
      user: { name: msg.sender.full_name },
      createdAt: msg.created_at,
    })) || []
  );
}

async function createChatRoom(userId: string, category: string) {
  const { data: newRoom, error } = await supabaseClient
    .from("chat_room")
    .insert({ patient_id: userId, category })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating chat room: ${error.message}`);
  }
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
  console.log("---->inserting data: ", { message, chatRoomId });
  await supabaseClient
    .from("message")
    .insert([
      { content: message.trim(), chat_room_id: chatRoomId, sender_id: userId },
    ]);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildWorkingHoursMessage(
  workingHours: Array<{
    day_of_week: string;
    time_open: string;
    note: string | null;
  }>
) {
  // Group by day_of_week and sort by weekday order
  const weekdayOrder = [
    "월", // Monday
    "화",
    "수",
    "목",
    "금",
    "토",
    "일",
  ];

  // Map to { [day]: { open, note } }
  const hoursByDay = workingHours.reduce((acc, wh) => {
    acc[wh.day_of_week] = wh;
    return acc;
  }, {} as Record<string, (typeof workingHours)[0]>);

  // Find lunch time (assume note contains lunch info)
  const lunchNote =
    workingHours.find((wh) => wh.note && wh.note.includes("점심"))?.note || "";

  // Build open hours string (e.g. "월~금 : 10:00 ~ 18:00")
  // Group consecutive days with same time_open
  let openHoursStr = "";
  let groupStart = 0;
  while (groupStart < weekdayOrder.length) {
    const startDay = weekdayOrder[groupStart];
    const startHour = hoursByDay[startDay]?.time_open;
    let groupEnd = groupStart;
    while (
      groupEnd + 1 < weekdayOrder.length &&
      hoursByDay[weekdayOrder[groupEnd + 1]]?.time_open === startHour
    ) {
      groupEnd++;
    }
    if (startHour) {
      const dayRange =
        groupStart === groupEnd
          ? startDay
          : `${startDay}~${weekdayOrder[groupEnd]}`;
      openHoursStr += `- ${dayRange} : ${startHour}`;
      if (
        hoursByDay[startDay]?.note &&
        !hoursByDay[startDay].note?.includes("점심")
      ) {
        openHoursStr += ` (${hoursByDay[startDay].note})`;
      }
      openHoursStr += "\n";
    }
    groupStart = groupEnd + 1;
  }

  // Add lunch time if available
  let lunchStr = "";
  if (lunchNote) {
    lunchStr = `- 점심시간 : ${lunchNote
      .replace("점심시간", "")
      .replace(":", "")
      .trim()}`;
  }

  return `안녕하세요, 고객님 치아 1:1 채팅 고객센터입니다. 궁금하신 사항을 선택해 주세요. 해당하는 문의가 없는 경우에는 [기타]를 선택해 주세요.\n운영시간 (토,일, 공휴일 제외)\n${openHoursStr}${lunchStr}`;
}
