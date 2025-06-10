"use client";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { RealtimeChat } from "./components/realtime-chat";
import { supabaseClient } from "@/lib/supabase/client";
import { useUserStore } from "@/providers/user-store-provider";
import { useState, useMemo, useEffect } from "react";

export default function ChatPage() {
  // Track unread message count by category for all rooms for the current user
  const [unreadByCategory, setUnreadByCategory] = useState<
    Record<string, number>
  >({});
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

  // Fetch unread message count for all rooms for the logged-in user, grouped by category
  useEffect(() => {
    async function fetchUnreadCountForAllRooms() {
      if (!user?.id) {
        setUnreadByCategory({});
        return;
      }
      // Fetch all chat rooms for the user
      const { data: rooms, error } = await supabaseClient
        .from("chat_room")
        .select("id, last_user_read_at, category")
        .eq("patient_id", user.id);

      if (error || !rooms) {
        setUnreadByCategory({});
        return;
      }

      // For each room, get unread count and group by category
      const categoryCounts: Record<string, number> = {};
      for (const room of rooms) {
        const count = await getUnreadMessageCount(
          user.id,
          room.id,
          room.last_user_read_at || "1970-01-01T00:00:00Z"
        );
        const cat = room.category || "기타";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + count;
      }
      setUnreadByCategory(categoryCounts);
    }
    fetchUnreadCountForAllRooms();
  }, [user?.id, chatRoom?.id, chatRoom?.last_user_read_at]);

  // 2. Infinite query for messages
  const {
    data: infiniteMessagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["messages-infinite", chatRoom?.id],
    queryFn: async ({ pageParam }) =>
      fetchMessagesPage(chatRoom?.id as string, pageParam),
    enabled: !!chatRoom?.id && !!roomCategory,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].createdAt;
    },
    refetchOnWindowFocus: false,
    initialPageParam: "", // Use an empty string as the initialPageParam
  });

  // Combine all pages (reverse to chronological order)
  const infiniteMessages = useMemo(() => {
    if (!infiniteMessagesData?.pages) return [];
    return [...infiniteMessagesData.pages.flat()].reverse();
  }, [infiniteMessagesData]);

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

  // Mark all messages as read when the chat is opened or new messages arrive
  useEffect(() => {
    async function markAsRead() {
      if (!chatRoom?.id) return;
      // Find the latest message timestamp
      const latestMsg =
        infiniteMessages.length > 0
          ? infiniteMessages[infiniteMessages.length - 1]
          : null;
      const latestTimestamp = latestMsg?.createdAt || new Date().toISOString();
      await updateLastPatientReadAt(chatRoom.id, latestTimestamp);
      // After marking as read, refetch unread counts for all rooms
      if (user?.id) {
        const { data: rooms } = await supabaseClient
          .from("chat_room")
          .select("id, last_user_read_at, category")
          .eq("patient_id", user.id);
        const categoryCounts: Record<string, number> = {};
        if (rooms) {
          for (const room of rooms) {
            const count = await getUnreadMessageCount(
              user.id,
              room.id,
              room.last_user_read_at || "1970-01-01T00:00:00Z"
            );
            const cat = room.category || "기타";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + count;
          }
        }
        setUnreadByCategory(categoryCounts);
      }
    }
    if (chatRoom?.id && infiniteMessages.length > 0) {
      markAsRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRoom?.id, infiniteMessages.length]);

  // --- Realtime subscription for admin messages ---
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new messages inserted by admin (assuming admin messages have a specific sender_id or role)
    const channel = supabaseClient
      .channel(`patient-chat-admin-messages-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message" },
        async (payload) => {
          // Only count if the sender is not the current user (i.e., admin message)

          if (payload.new.sender_id !== user.id) {
            // Refetch unread counts for all rooms
            const { data: rooms } = await supabaseClient
              .from("chat_room")
              .select("id, last_user_read_at, category")
              .eq("patient_id", user.id);
            const categoryCounts: Record<string, number> = {};
            if (rooms) {
              for (const room of rooms) {
                const count = await getUnreadMessageCount(
                  user.id,
                  room.id,
                  room.last_user_read_at || "1970-01-01T00:00:00Z"
                );
                const cat = room.category || "기타";
                categoryCounts[cat] = (categoryCounts[cat] || 0) + count;
              }
            }
            setUnreadByCategory(categoryCounts);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe?.();
    };
  }, [user?.id]);

  if (chatRoomLoading) {
    return <div>Loading chat...</div>;
  }

  return (
    <>
      <RealtimeChat
        key={roomCategory}
        roomName={chatRoom?.id && roomCategory ? chatRoom.id : "no room"}
        username={user?.full_name || "no name"}
        messages={roomCategory ? infiniteMessages : []}
        onMessage={(msg) => sendMessageMutation.mutate(msg)}
        onSelectRoomCategory={(rCategory) => setRoomCategory(rCategory)}
        fetchPrevMessages={fetchNextPage}
        hasMorePrev={!!hasNextPage}
        isFetchingPrev={isFetchingNextPage}
        unreadByCategory={unreadByCategory}
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

// Fetch a single page of messages for infinite query
async function fetchMessagesPage(chatRoomId: string, pageParam?: string) {
  if (!chatRoomId) return [];
  const PAGE_SIZE = 20;
  let query = supabaseClient
    .from("message")
    .select("*, sender:sender_id(full_name)")
    .eq("chat_room_id", chatRoomId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  // Only add .lt if pageParam is a valid string
  if (typeof pageParam === "string" && pageParam) {
    query = query.lt("created_at", pageParam);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (
    data?.map((msg) => ({
      id: msg.id,
      content: msg.content,
      user: { name: msg.sender?.full_name || "Unknown Sender" },
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

// Helper to update last_patient_read_at for the chat room
async function updateLastPatientReadAt(roomId: string, timestamp: string) {
  if (!roomId || !timestamp) return;
  await supabaseClient
    .from("chat_room")
    .update({ last_user_read_at: timestamp })
    .eq("id", roomId);
}

// Helper to get unread message count for the patient
async function getUnreadMessageCount(
  userId: string,
  roomId: string,
  lastPatientReadAt: string
): Promise<number> {
  const { count, error } = await supabaseClient
    .from("message")
    .select("*", { count: "exact", head: true })
    .eq("chat_room_id", roomId)
    .filter("sender_id", "not.eq", userId)
    .gt("created_at", lastPatientReadAt);
  if (error) {
    console.error(
      `Error fetching unread count for room ${roomId}:`,
      error.message
    );
    return 0;
  }
  return count || 0;
}
