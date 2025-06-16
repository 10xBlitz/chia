"use client";
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { RealtimeChat } from "./components/realtime-chat";
import { supabaseClient } from "@/lib/supabase/client";
import { useUserStore } from "@/providers/user-store-provider";
import { useState, useMemo, useEffect } from "react";
import {
  createChatRoom,
  fetchRoom,
  fetchRooms,
  updateRoom,
} from "@/lib/supabase/services/room.services";
import {
  fetchLatestMessageOfRoom,
  fetchMessagesOfRoom,
  fetchUnreadMessageCountOfRoom,
  insertMessage,
} from "@/lib/supabase/services/messages.services";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCategory = searchParams.get("roomCategory") || undefined;
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();

  // Query for all chat rooms for the user (for realtime check and unread counts)
  const { data: userRooms = [], isLoading: isLoadingUserRooms } = useQuery({
    queryKey: ["patient-chat-rooms", user?.id],
    queryFn: async () => await fetchRooms({ patient_id: user?.id }),
    enabled: !!user?.id,
  });

  // Query for unread counts
  const { data: unreadCounts } = useQuery({
    queryKey: ["unread-counts", user?.id, userRooms],
    queryFn: async () => {
      if (!user?.id || !userRooms.length) return {};
      const counts = await Promise.all(
        userRooms.map((room) =>
          fetchUnreadMessageCountOfRoom(
            user.id,
            room.id,
            room.last_user_read_at || "1970-01-01T00:00:00Z"
          ).then((count) => ({
            cat: room.category || "기타",
            count,
          }))
        )
      );
      const categoryCounts: Record<string, number> = {};
      for (const { cat, count } of counts) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + count;
      }
      return categoryCounts;
    },
    enabled: !!user?.id && !!userRooms.length,
  });

  // Use unreadCounts from query for unreadByCategory
  const unreadByCategory = unreadCounts || {};

  // Query for chat room
  const { data: chatRoom, isLoading: chatRoomLoading } = useQuery({
    queryKey: ["chatRoom", user?.id, roomCategory],
    queryFn: async () =>
      await fetchOrCreateChatRoom(user?.id as string, roomCategory as string),
    enabled: !!user?.id && !!roomCategory,
  });

  // Infinite query for messages
  const {
    data: infiniteMessagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["messages-infinite", chatRoom?.id],
    queryFn: async ({ pageParam }) =>
      await fetchMessagesOfRoom(chatRoom?.id as string, pageParam),
    enabled: !!chatRoom?.id && !!roomCategory,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].createdAt;
    },
    refetchOnWindowFocus: false,
    initialPageParam: "",
  });

  // Combine all pages (reverse to chronological order)
  const infiniteMessages = useMemo(() => {
    if (!infiniteMessagesData?.pages) return [];
    return [...infiniteMessagesData.pages.flat()].reverse();
  }, [infiniteMessagesData]);

  // Mutation to send message
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastSentMessage, setLastSentMessage] = useState<string>("");

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user || !chatRoom?.id) return;
      setLastSentMessage(message);
      await insertMessage({
        content: message,
        chat_room_id: chatRoom.id,
        sender_id: user.id,
      });
    },
    onError: () => {
      setSendError("메시지 전송에 실패했습니다. 다시 시도해 주세요.");
    },
    onMutate: () => {
      setSendError(null);
    },
  });

  // Update last read time when user selects a category (room)
  const handleSelectRoomCategory = async (rCategory: string | undefined) => {
    const url = new URL(window.location.href);
    if (rCategory) {
      url.searchParams.set("roomCategory", rCategory);
    } else {
      url.searchParams.delete("roomCategory");
    }
    router.replace(url.pathname + url.search);
    // Find the chat room for this category
    const selectedRoom = userRooms.find((room) => room.category === rCategory);
    if (selectedRoom) {
      // Fetch the latest message for this room
      const latestMsg = await fetchLatestMessageOfRoom(selectedRoom.id);
      const latestTimestamp = latestMsg?.created_at || new Date().toISOString();

      try {
        // Optimistically update unread count for this category
        queryClient.setQueryData(
          ["unread-counts", user?.id, userRooms],
          (old: Record<string, number> | undefined) => {
            if (!old) return old;
            return {
              ...old,
              [selectedRoom.category || "기타"]: 0,
            };
          }
        );
        await updateRoom(selectedRoom.id, {
          last_user_read_at: latestTimestamp,
        });
      } catch (err) {
        // Optionally, show an error message or log
        console.error("Failed to update last read at:", err);
      }
    }
  };

  // --- Realtime subscription for admin messages and mark as read ---
  useEffect(() => {
    if (!user?.id || isLoadingUserRooms) return;
    console.log("userRooms after loading:", userRooms);

    console.log("---->userrooms:", userRooms);

    console.log("----->Subscribing to realtime messages for user:", user.id);

    const channel = supabaseClient
      .channel(`patient-chat-admin-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `chat_room_id=in.(${userRooms
            .map((item) => item.id)
            .join(",")})`,
        },
        async (payload) => {
          console.log("----->Realtime message received:", payload);
          if (
            payload.new &&
            payload.new.chat_room_id &&
            payload.new.sender_id !== user.id
          ) {
            // If the message is from admin and not sent by the user
            const room = userRooms.find(
              (r) => r.id === payload.new.chat_room_id
            );
            const cat = room?.category || "기타"; // 기타 = etc

            // Only update unread count if the category is different from the current roomCategory
            if (cat && cat !== roomCategory) {
              queryClient.setQueryData(
                ["unread-counts", user?.id, userRooms],
                (old: Record<string, number> | undefined) => {
                  if (!old) return old;
                  return {
                    ...old,
                    [cat]: (old[cat] || 0) + 1,
                  };
                }
              );
            }
            // --- NEW: If the message is for the currently open chat room, update lastPatientReadAt ---
            if (chatRoom?.id && payload.new.chat_room_id === chatRoom?.id) {
              console.log("-----> same room, updating last read at");
              // Update last_user_read_at to the latest message's created_at
              await updateRoom(chatRoom.id, {
                last_user_read_at: payload.new.created_at,
              });
            }
          }
        }
      )
      .subscribe();

    console.log("----->Subscribed to realtime messages for user:", user.id);

    return () => {
      channel.unsubscribe?.();
    };
  }, [
    user?.id,
    userRooms,
    isLoadingUserRooms,
    queryClient,
    roomCategory,
    chatRoom?.id,
  ]);

  // --- Listen for changes to last_admin_read_at and update UI for seen status ---
  const [adminLastReadAt, setAdminLastReadAt] = useState<string | null>(null);
  useEffect(() => {
    if (!chatRoom?.id) return;
    // Subscribe to changes in the chat room's last_admin_read_at field
    const channel = supabaseClient
      .channel(`patient-chat-room-${chatRoom.id}-admin-read`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_room",
          filter: `id=eq.${chatRoom.id}`,
        },
        (payload) => {
          if (payload.new?.last_admin_read_at) {
            setAdminLastReadAt(payload.new.last_admin_read_at);
          }
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe?.();
    };
  }, [chatRoom?.id]);

  if (chatRoomLoading) {
    return <div>채팅방을 로딩 중입니다...{/**Loading chat rooms... */}</div>;
  }

  return (
    <>
      <RealtimeChat
        key={roomCategory}
        roomName={chatRoom?.id && roomCategory ? chatRoom.id : "no room"}
        username={user?.full_name || "no name"}
        messages={roomCategory ? infiniteMessages : []}
        onMessage={(msg) => sendMessageMutation.mutate(msg)}
        onSelectRoomCategory={handleSelectRoomCategory}
        fetchPrevMessages={fetchNextPage}
        hasMorePrev={!!hasNextPage}
        isFetchingPrev={isFetchingNextPage}
        unreadByCategory={unreadByCategory}
        sendError={sendError}
        sendingStatus={
          sendMessageMutation.status === "pending"
            ? "sending"
            : sendMessageMutation.isSuccess
            ? "delivered"
            : "idle"
        }
        lastSentMessage={lastSentMessage}
        adminLastReadAt={adminLastReadAt}
      />
    </>
  );
}

async function fetchOrCreateChatRoom(userId: string, roomCategory: string) {
  const chatRoom = await fetchRoom({
    patient_id: userId,
    category: roomCategory,
  });

  if (!chatRoom) {
    // If no chat room exists, create a new one
    const newRoom = await createChatRoom(userId, roomCategory);
    return newRoom;
  }

  return chatRoom;
}
