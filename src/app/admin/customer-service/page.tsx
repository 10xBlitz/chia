"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  handleRealtimeMessage,
  ChatRoomFromDB,
  DisplayRoomInfo,
  subscribeToLastPatientReadAt,
} from "./chat-admin-helpers";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatMessage } from "./hooks/use-realtime-chat";
import { RealtimeChat } from "./components/realtime-chat";
import {
  fetchMessagesOfRoom,
  insertMessage,
} from "@/lib/supabase/services/messages.services";
import { updateRoom } from "@/lib/supabase/services/room.services";

export default function CustomerServiceChatListener() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get filters from searchParams
  const searchParam = searchParams.get("search") ?? "";

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParam);
  const debouncedSearch = useDebounce(search, 300);
  const [roomLimit, setRoomLimit] = useState(20);
  const [lastPatientReadAt, setLastPatientReadAt] = useState<string | null>(
    null
  );
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();
  // Use a specific type for the subscription ref
  const lastAdminReadAtSubscriptionRef = useRef<{
    unsubscribe: () => void;
  } | null>(null);

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
  // Helper to select a room and set lastAdminReadAt from openRooms
  const handleSelectRoom = useCallback(
    (roomId: string) => {
      setSelectedRoom(roomId);
      const found = openRooms.find((r) => r.room_id === roomId);
      setLastPatientReadAt(found?.last_patient_read_at || null);
    },
    [openRooms]
  );
  //Updates the last read date for a room to latest message when a room is selected
  const setLastReadDateToLatestMessage = useCallback(
    async (roomId: string, latestMessageTimeStampParam?: string) => {
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

      const latestMessageTimestamp =
        latestMessageTimeStampParam ??
        getRoomLatestTimestamp(roomId, openRooms);

      try {
        // await updateRoom(roomId, latestMessageTimestamp);
        updateRoom(roomId, { last_admin_read_at: latestMessageTimestamp });
        //Promise to wait for the update to complete in supabase
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

  // Infinite query for messages (all Supabase logic is in fetchMessagesInfinite helper)
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
      if (!selectedRoom) return [];

      return await fetchMessagesOfRoom(
        selectedRoom,
        typeof pageParam === "string" ? pageParam : undefined
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

  // Send a message in the selected room (delegates to reusable helper)
  const sendMessage = async (message: string) => {
    if (!user || !message.trim() || !selectedRoom) return;
    await insertMessage({
      chat_room_id: selectedRoom,
      sender_id: user.id,
      content: message,
    });
  };

  // --- Effects ---
  useEffect(() => {
    // Update searchParams in URL when filters change
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }

    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (selectedRoom && user?.id) {
      setLastReadDateToLatestMessage(selectedRoom);
    }
  }, [selectedRoom, user?.id, setLastReadDateToLatestMessage]);

  useEffect(() => {
    if (!user?.id) return;
    const channelName = `admin-cs-messages`;
    const messageSubscription = handleRealtimeMessage(
      channelName,
      selectedRoom,
      setLastReadDateToLatestMessage,
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
    setLastReadDateToLatestMessage,
    debouncedSearch,
    roomLimit,
  ]);

  // Subscribe to last_patient_read_at changes in real time ("seen" status)
  useEffect(() => {
    if (!selectedRoom) return;
    // Unsubscribe previous
    if (lastAdminReadAtSubscriptionRef.current) {
      lastAdminReadAtSubscriptionRef.current.unsubscribe();
    }
    // Subscribe using helper
    const channel = subscribeToLastPatientReadAt(selectedRoom, (newReadAt) => {
      setLastPatientReadAt(newReadAt);
    });
    lastAdminReadAtSubscriptionRef.current = channel;
    return () => {
      channel?.unsubscribe?.();
    };
  }, [selectedRoom]);

  // --- Render ---

  return (
    <div className="flex gap-2 bg-gray-100 min-h-[calc(100dvh-44px)]">
      <ChatRoomSidebar
        openRooms={openRooms}
        isLoadingRoomsWithDetails={isLoadingRoomsWithDetails}
        isFetchingRooms={isFetchingRooms || isFetchingRoomDetails}
        roomsWithDetailsData={roomsWithDetailsData}
        initialRoomsData={initialRoomsData}
        isLoadingInitialRooms={isLoadingInitialRooms}
        selectedRoom={selectedRoom}
        setSelectedRoom={handleSelectRoom}
        search={search}
        setSearch={setSearch}
        onLoadMore={() => setRoomLimit((prev) => prev + 20)}
        hasMore={!!initialRoomsData && initialRoomsData.length >= roomLimit}
      />
      <div className="flex-1 flex flex-col max-h-[calc(100dvh-44px)]">
        {selectedRoom ? (
          isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              {/* 메시지 불러오는 중... (Loading messages...) */}
              <p>메시지 불러오는 중...</p>
            </div>
          ) : messagesError ? (
            <div className="flex-1 flex items-center justify-center text-red-500">
              {/* 메시지 불러오기 오류: (Error loading messages:) */}
              <p>메시지 불러오기 오류: {messagesError.message}</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto">
              <RealtimeChat
                key={selectedRoom}
                roomName={selectedRoom}
                username={user?.full_name || "Admin"}
                messages={infiniteMessages}
                onMessage={sendMessage}
                fetchPrevMessages={fetchNextPage}
                hasMorePrev={!!hasNextPage}
                isFetchingPrev={isFetchingNextPage}
                lastPatientReadAt={lastPatientReadAt}
              />
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            {/* 채팅을 시작할 방을 선택하세요. (Select a room to start chatting.) */}
            채팅을 시작할 방을 선택하세요.
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
    <aside className="w-64 bg-whiteborder-r bg-sidebar rounded-md p-4 flex flex-col min-h-[calc(100dvh-44px)] max-h-[calc(100dvh-44px)]">
      <h2 className="font-bold mb-4">
        {/* 오픈 채팅방 (Open Chat Rooms) */}오픈 채팅방
      </h2>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mb-3 flex flex-col gap-2"
      >
        <Input
          type="text"
          // 사용자 이름으로 검색 (Search by user name)
          placeholder="사용자 이름으로 검색"
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
        // 채팅방 정보 불러오는 중... (Loading room details...)
        <p>채팅방 정보 불러오는 중...</p>
      ) : openRooms.length === 0 && !isLoadingInitialRooms ? (
        // 활성화된 채팅방이 없습니다. (No active chat rooms)
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
                    {/* {room.category || "일반 문의"} (General Inquiry) */}
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
                {/* {isFetchingRooms ? "Loading..." : "Load More"} */}
                {isFetchingRooms ? "불러오는 중..." : "더 보기"}
              </Button>
            )}
          </ul>
        </>
      )}
    </aside>
  );
}
