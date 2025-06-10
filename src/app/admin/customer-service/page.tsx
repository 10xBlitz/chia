"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { useUserStore } from "@/providers/user-store-provider";
import { RealtimeChat } from "../../patient/profile/chat/components/realtime-chat";
import { ChatMessage } from "../../patient/profile/chat/hooks/use-realtime-chat";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ChatRoomFromDB {
  // This is what's fetched by the first query
  id: string;
  category: string | null;
  user: { full_name: string | null } | null;
  last_admin_read_at: string | null;
  // last_message_at: string | null; // REMOVED - assuming it's not in DB yet
}

interface DisplayRoomInfo {
  room_id: string;
  person_name: string;
  category: string | null;
  latest_message_timestamp: string | null; // This will be fetched individually
  unread_message_count: number;
}

export default function CustomerServiceChatListener() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();

  // 1. Fetch all chat rooms, including 'last_admin_read_at'
  const { data: initialRoomsData, isLoading: isLoadingInitialRooms } = useQuery<
    ChatRoomFromDB[],
    Error
  >({
    queryKey: ["admin_chat_rooms_list_with_read_status", user?.id],
    queryFn: async () => {
      console.log("----->fetching rooms with read status for admin");
      if (!user?.id) return [];
      const { data, error } = await supabaseClient
        .from("chat_room")
        .select(
          "id, category, user!patient_id(full_name), last_admin_read_at" // Not selecting last_message_at
        )
        .order("created_at", { ascending: false }); // Or sort by another relevant field like created_at
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // 2. Calculate latest message timestamp AND unread counts for each room sequentially
  const { data: roomsWithDetailsData, isLoading: isLoadingRoomsWithDetails } =
    useQuery({
      queryKey: [
        "admin_rooms_with_unread_details",
        user?.id,
        // initialRoomsData, // Not strictly needed in key if enabled flag handles dependency
      ],
      queryFn: async () => {
        console.log(
          "----->calculating latest message and unread details for admin rooms (sequentially)"
        );
        if (!user?.id || !initialRoomsData || initialRoomsData.length === 0) {
          return [];
        }

        const processedRooms: DisplayRoomInfo[] = [];

        for (const room of initialRoomsData) {
          // Iterate sequentially
          // Fetch latest message timestamp for the current room
          const { data: latestMessage, error: msgError } = await supabaseClient
            .from("message")
            .select("created_at")
            .eq("chat_room_id", room.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (msgError) {
            console.error(
              `Error fetching latest message for room ${room.id}:`,
              msgError.message
            );
          }

          const lastAdminReadTimestamp =
            room.last_admin_read_at || "1970-01-01T00:00:00Z";

          // Perform the database call for unread count for the current room
          const { count, error: countError } = await supabaseClient
            .from("message")
            .select("*", { count: "exact" })
            .eq("chat_room_id", room.id)
            .gt("created_at", lastAdminReadTimestamp);

          if (countError) {
            console.error(
              `Error fetching unread count for room ${room.id}:`,
              countError.message
            );
          }

          processedRooms.push({
            room_id: room.id,
            person_name: room.user?.full_name || "Unknown User",
            category: room.category,
            latest_message_timestamp: latestMessage?.created_at || null, // Use fetched latest message
            unread_message_count: count || 0,
          });
        }

        // Sort the processed rooms
        return processedRooms.sort((a, b) => {
          if (a.unread_message_count > 0 && b.unread_message_count === 0)
            return -1;
          if (b.unread_message_count > 0 && a.unread_message_count === 0)
            return 1;
          if (
            a.latest_message_timestamp === null &&
            b.latest_message_timestamp === null
          )
            return 0;
          if (a.latest_message_timestamp === null) return 1;
          if (b.latest_message_timestamp === null) return -1;
          return (
            new Date(b.latest_message_timestamp).getTime() -
            new Date(a.latest_message_timestamp).getTime()
          );
        });
      },
      enabled: !!user?.id && !!initialRoomsData && initialRoomsData.length > 0,
    });

  const openRooms: DisplayRoomInfo[] = useMemo(
    () => roomsWithDetailsData || [],
    [roomsWithDetailsData]
  );

  const updateRoomLastReadDate = useCallback(
    async (roomId: string) => {
      console.log(
        "---> (handleMarkRoomAsRead) updating last_admin_read_at for room:",
        roomId
      );
      if (!user?.id || !roomId) {
        console.log(
          "---> (handleMarkRoomAsRead) Aborting: user or roomId missing."
        );
        return;
      }

      const optimisticUpdateQueryKey = [
        "admin_rooms_with_unread_details",
        user?.id,
      ];
      const previousRoomsWithDetails = queryClient.getQueryData<
        DisplayRoomInfo[]
      >(optimisticUpdateQueryKey);

      // Optimistically update the UI
      queryClient.setQueryData<DisplayRoomInfo[]>(
        optimisticUpdateQueryKey,
        (oldData) =>
          oldData?.map((room) =>
            room.room_id === roomId
              ? { ...room, unread_message_count: 0 }
              : room
          ) || []
      );

      try {
        const { error } = await supabaseClient
          .from("chat_room")
          .update({ last_admin_read_at: new Date().toISOString() })
          .eq("id", roomId);

        console.log(
          "----> (handleMarkRoomAsRead) finished updating last_admin_read_at for room:",
          roomId
        );
        if (error) {
          throw error; // Let the catch block handle it
        }
        // If successful, the refetches in 'finally' will confirm the state.
      } catch (error) {
        console.error(
          "Error in handleMarkRoomAsRead for room " + roomId + ":",
          error
        );

        // Rollback optimistic update on error
        if (previousRoomsWithDetails) {
          queryClient.setQueryData<DisplayRoomInfo[]>(
            optimisticUpdateQueryKey,
            previousRoomsWithDetails
          );
        }
      } finally {
        // Always refetch to ensure data consistency with the server
        queryClient.refetchQueries({
          queryKey: ["admin_chat_rooms_list_with_read_status", user?.id],
        });
        queryClient.refetchQueries({
          queryKey: ["admin_rooms_with_unread_details", user?.id],
        });
      }
    },
    [queryClient, user?.id]
  );

  useEffect(() => {
    if (selectedRoom && user?.id) {
      updateRoomLastReadDate(selectedRoom);
    }
  }, [selectedRoom, user?.id, updateRoomLastReadDate]);

  useEffect(() => {
    if (!user?.id) return;
    const channelName = `admin-cs-messages`;
    const messageSubscription = supabaseClient
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message" },
        (payload) => {
          console.log(
            "Realtime: >>> New message event RECEIVED! Room:",
            payload.new.chat_room_id
          );
          // When a new message comes in, we need to refetch everything to update
          // latest message timestamps and unread counts.
          queryClient.refetchQueries({
            queryKey: ["admin_chat_rooms_list_with_read_status", user?.id],
          });
          queryClient.refetchQueries({
            queryKey: ["admin_rooms_with_unread_details", user?.id],
          });
          const newMsgRoomId = payload.new.chat_room_id;
          // If the new message is for the currently selected room, mark it as read for the admin
          if (newMsgRoomId && selectedRoom && newMsgRoomId === selectedRoom) {
            console.log(
              `Realtime: New message in selected room ${selectedRoom}, marking as read.`
            );
            updateRoomLastReadDate(selectedRoom); // This will update last_admin_read_at
          }

          // if (payload.new.chat_room_id === selectedRoom) {
          //   queryClient.invalidateQueries({
          //     queryKey: ["messages", selectedRoom],
          //   });
          // }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(
            `Realtime: Successfully SUBSCRIBED to ${channelName} for message inserts!`
          );
        } else if (err) {
          console.error(`Realtime subscription to ${channelName} error:`, err);
        }
      });
    return () => {
      supabaseClient.removeChannel(messageSubscription);
    };
  }, [user?.id, queryClient, selectedRoom, updateRoomLastReadDate]);

  const {
    data: currentRoomMessages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery<ChatMessage[], Error>({
    queryKey: ["messages", selectedRoom],
    queryFn: async () => {
      console.log("----->fetching messages for selected room:", selectedRoom);
      if (!selectedRoom) return [];
      const { data, error } = await supabaseClient
        .from("message")
        .select("*, sender:sender_id(full_name)")
        .eq("chat_room_id", selectedRoom)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (
        data?.map((msg) => ({
          id: msg.id,
          content: msg.content,
          user: { name: msg.sender?.full_name || "Unknown Sender" },
          createdAt: msg.created_at,
        })) || []
      );
    },
    enabled: !!selectedRoom,
  });

  const sendMessage = async (message: string) => {
    if (!user || !message.trim() || !selectedRoom) return;
    await supabaseClient.from("message").insert([
      {
        content: message.trim(),
        chat_room_id: selectedRoom,
        sender_id: user.id,
      },
    ]);

    await supabaseClient
      .from("chat_room")
      .update({ last_admin_read_at: new Date().toISOString() })
      .eq("id", selectedRoom);
  };

  // const isLoadingOverall = isLoadingInitialRooms || isLoadingRoomsWithDetails;

  if (isLoadingInitialRooms && !initialRoomsData) {
    return <p className="text-gray-500">채팅방 목록 로딩 중...</p>;
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-100 border-r p-4">
        <h2 className="font-bold mb-4">Open Chat Rooms</h2>
        {isLoadingRoomsWithDetails &&
        !roomsWithDetailsData &&
        initialRoomsData &&
        initialRoomsData.length > 0 ? (
          <p>Loading room details...</p>
        ) : openRooms.length === 0 && !isLoadingInitialRooms ? (
          <p className="text-gray-500">활성화된 채팅방이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {openRooms.map((room) => (
              <Button
                key={room.room_id}
                variant={"ghost"}
                onClick={() => setSelectedRoom(room.room_id)}
                className={`w-full flex justify-between items-center p-3 rounded-lg text-left transition-colors duration-150 ease-in-out ${
                  selectedRoom === room.room_id
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="flex flex-col flex-grow">
                  <span className="font-medium text-gray-800">
                    {room.person_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {room.category || "일반 문의"}
                  </span>
                </div>
                {room.unread_message_count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full">
                    {room.unread_message_count}
                  </span>
                )}
              </Button>
            ))}
          </ul>
        )}
      </aside>
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <p>Loading messages...</p>
            </div>
          ) : messagesError ? (
            <div className="flex-1 flex items-center justify-center text-red-500">
              <p>Error loading messages: {messagesError.message}</p>
            </div>
          ) : (
            <RealtimeChat
              key={selectedRoom}
              roomName={selectedRoom}
              username={user?.full_name || "Admin"}
              messages={currentRoomMessages || []}
              onMessage={sendMessage}
              onSelectRoomCategory={() => {}}
            />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a room to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
