"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import { Button } from "@/components/ui/button";
import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  fetchChatRooms,
  fetchRoomDetails,
  getRoomLatestTimestamp,
  updateLastAdminReadAt,
  handleRealtimeMessage,
  ChatRoomFromDB,
  DisplayRoomInfo,
} from "./chat-admin-helpers";
import { supabaseClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatMessage } from "./hooks/use-realtime-chat";
import { RealtimeChat } from "./components/realtime-chat";

export default function CustomerServiceChatListener() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get filters from searchParams
  const searchParam = searchParams.get("search") ?? "";

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParam);
  const debouncedSearch = useDebounce(search, 300);
  const [roomLimit, setRoomLimit] = useState(20);
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();

  // Update searchParams in URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }

    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // 1. Fetch all chat rooms, filtered by search and category (from DB), with pagination
  const {
    data: initialRoomsData,
    isLoading: isLoadingInitialRooms,
    isFetching: isFetchingRooms,
  } = useQuery<ChatRoomFromDB[], Error>({
    queryKey: [
      "admin_chat_rooms_list_with_read_status",
      debouncedSearch,
      roomLimit,
    ],
    queryFn: () => fetchChatRooms(debouncedSearch, roomLimit),
    enabled: true,
    staleTime: 1000 * 60, // cache for 1 minute to avoid unnecessary refetches
    refetchOnWindowFocus: false, // don't refetch on window focus
  });

  // Fetch room details (latest message, unread count)
  const {
    data: roomsWithDetailsData,
    isLoading: isLoadingRoomsWithDetails,
    isFetching: isFetchingRoomDetails,
  } = useQuery({
    queryKey: ["admin_rooms_with_unread_details", debouncedSearch, roomLimit],
    queryFn: () => fetchRoomDetails(user?.id, initialRoomsData),
    enabled: !!user?.id && !!initialRoomsData && initialRoomsData.length > 0,
    staleTime: 1000 * 60, // cache for 1 minute
    refetchOnWindowFocus: false,
  });

  const openRooms: DisplayRoomInfo[] = useMemo(
    () => roomsWithDetailsData || [],
    [roomsWithDetailsData]
  );

  // Mark all messages as read in a room
  const updateRoomLastReadDate = useCallback(
    async (roomId: string, referenceTimestamp?: string) => {
      if (!user?.id || !roomId) return;

      const optimisticUpdateQueryKey = [
        "admin_rooms_with_unread_details",
        debouncedSearch,
        roomLimit,
      ];
      const previousRoomsWithDetails = queryClient.getQueryData<
        DisplayRoomInfo[]
      >(optimisticUpdateQueryKey);

      // Optimistically update UI
      queryClient.setQueryData<DisplayRoomInfo[]>(
        optimisticUpdateQueryKey,
        (oldData) =>
          oldData?.map((room) =>
            room.room_id === roomId
              ? { ...room, unread_message_count: 0 }
              : room
          ) || []
      );

      const latestMessageTimestamp = getRoomLatestTimestamp(
        roomId,
        openRooms,
        referenceTimestamp
      );

      console.log("----->referenceTimestamp:", latestMessageTimestamp);

      try {
        await updateLastAdminReadAt(roomId, latestMessageTimestamp);
        await new Promise((resolve) => setTimeout(resolve, 200));
        console.log("----> refething queries after updating last read date");
        queryClient.refetchQueries({
          queryKey: [
            "admin_chat_rooms_list_with_read_status",
            debouncedSearch,
            roomLimit,
          ],
        });
        queryClient.refetchQueries({
          queryKey: [
            "admin_rooms_with_unread_details",
            debouncedSearch,
            roomLimit,
          ],
        });
        console.log(
          "finished refetching queries after updating last read date"
        );
      } catch (error) {
        console.error("--->error updating last read date:", error);
        if (previousRoomsWithDetails) {
          queryClient.setQueryData<DisplayRoomInfo[]>(
            optimisticUpdateQueryKey,
            previousRoomsWithDetails
          );
        }
      }
    },
    [queryClient, user?.id, openRooms, debouncedSearch, roomLimit]
  );

  // Infinite query for messages
  const {
    data: infiniteMessagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useInfiniteQuery<ChatMessage[], Error>({
    queryKey: ["messages-infinite", selectedRoom],
    queryFn: async ({ pageParam }) => {
      // pageParam is the cursor (oldest message's createdAt)
      if (!selectedRoom) return [];
      const PAGE_SIZE = 20;
      let query = supabaseClient
        .from("message")
        .select("*, sender:sender_id(full_name)")
        .eq("chat_room_id", selectedRoom)
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
    },
    enabled: !!selectedRoom,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      // The last message's createdAt is the new cursor
      return lastPage[lastPage.length - 1].createdAt;
    },
    refetchOnWindowFocus: false,
    initialPageParam: undefined,
  });

  // Combine all pages (reverse to chronological order)
  const infiniteMessages = useMemo(() => {
    if (!infiniteMessagesData?.pages) return [];
    // Flatten and reverse to ascending order
    return [...infiniteMessagesData.pages.flat()].reverse();
  }, [infiniteMessagesData]);

  // Send a message in the selected room
  const sendMessage = async (message: string) => {
    if (!user || !message.trim() || !selectedRoom) return;
    await supabaseClient.from("message").insert([
      {
        content: message.trim(),
        chat_room_id: selectedRoom,
        sender_id: user.id,
      },
    ]);
    // await updateLastAdminReadAt(selectedRoom, new Date().toISOString());
  };

  // --- Effects ---

  useEffect(() => {
    if (selectedRoom && user?.id) {
      updateRoomLastReadDate(selectedRoom);
    }
  }, [selectedRoom, user?.id, updateRoomLastReadDate]);

  useEffect(() => {
    if (!user?.id) return;
    const channelName = `admin-cs-messages`;
    const messageSubscription = handleRealtimeMessage(
      channelName,
      selectedRoom,
      updateRoomLastReadDate,
      queryClient,
      user?.id,
      debouncedSearch,
      roomLimit
    );
    return () => {
      messageSubscription?.unsubscribe?.();
    };
  }, [
    user?.id,
    queryClient,
    selectedRoom,
    updateRoomLastReadDate,
    debouncedSearch,
    roomLimit,
  ]);

  // --- Render ---

  return (
    <div className="flex h-screen gap-2 bg-gray-100">
      <ChatRoomSidebar
        openRooms={openRooms}
        isLoadingRoomsWithDetails={isLoadingRoomsWithDetails}
        isFetchingRooms={isFetchingRooms || isFetchingRoomDetails}
        roomsWithDetailsData={roomsWithDetailsData}
        initialRoomsData={initialRoomsData}
        isLoadingInitialRooms={isLoadingInitialRooms}
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
        search={search}
        setSearch={setSearch}
        onLoadMore={() => setRoomLimit((prev) => prev + 20)}
        hasMore={!!initialRoomsData && initialRoomsData.length >= roomLimit}
      />
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
              messages={infiniteMessages}
              onMessage={sendMessage}
              fetchPrevMessages={fetchNextPage}
              hasMorePrev={!!hasNextPage}
              isFetchingPrev={isFetchingNextPage}
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

// --- Helper Components & Functions ---

function ChatRoomSidebar({
  openRooms,
  isLoadingRoomsWithDetails,
  isFetchingRooms,
  roomsWithDetailsData,
  initialRoomsData,
  isLoadingInitialRooms,
  selectedRoom,
  setSelectedRoom,
  search,
  setSearch,
  onLoadMore,
  hasMore,
}: {
  openRooms: DisplayRoomInfo[];
  isLoadingRoomsWithDetails: boolean;
  isFetchingRooms: boolean;
  roomsWithDetailsData: DisplayRoomInfo[] | undefined;
  initialRoomsData: ChatRoomFromDB[] | undefined;
  isLoadingInitialRooms: boolean;
  selectedRoom: string | null;
  setSelectedRoom: (id: string) => void;
  search: string;
  setSearch: (s: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}) {
  return (
    <aside className="w-64 bg-whiteborder-r bg-sidebar rounded-md p-4 flex flex-col h-full">
      <h2 className="font-bold mb-4">Open Chat Rooms</h2>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mb-3 flex flex-col gap-2"
      >
        <Input
          type="text"
          placeholder="Search by user name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1 border rounded"
        />
        {/* Category select filter removed */}
      </form>
      {isLoadingRoomsWithDetails &&
      !roomsWithDetailsData &&
      initialRoomsData &&
      initialRoomsData.length > 0 ? (
        <p>Loading room details...</p>
      ) : openRooms.length === 0 && !isLoadingInitialRooms ? (
        <p className="text-gray-500">활성화된 채팅방이 없습니다.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 flex-1 overflow-y-auto">
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
            {hasMore && (
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isFetchingRooms}
                className="mt-3 w-full"
              >
                {isFetchingRooms ? "Loading..." : "Load More"}
              </Button>
            )}
          </ul>
        </>
      )}
    </aside>
  );
}
