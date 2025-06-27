import React, { useCallback, useMemo, useState } from "react";
import { useInfiniteChatRooms } from "../hooks/use-infinite-chat-rooms";
import { useChatRoomsRealtime } from "../hooks/use-chat-rooms-realtime";
import { Tables } from "@/lib/supabase/types";
import { useUnreadCount } from "../hooks/use-unread-count";
import { useUserStore } from "@/providers/user-store-provider";
import { useRoomSelectionStore } from "../room-selection-context";
import { useQueryClient } from "@tanstack/react-query";
import { useClearUnread } from "../hooks/use-clear-unread";
import { useSearchChatRooms } from "../hooks/use-search-chat-rooms";
import { Input } from "@/components/ui/input";

interface ChatSidebarProps {
  patientId?: string;
}

export function ChatSidebar({ patientId }: ChatSidebarProps) {
  // Zustand store for room selection
  const currentRoomId = useRoomSelectionStore((s) => s.currentRoomId);
  const setCurrentRoom = useRoomSelectionStore((s) => s.setCurrentRoom);

  // Search state for sidebar searchbar
  const [search, setSearch] = useState("");
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useSearchChatRooms(search);

  // TanStack Query client for manual invalidation
  const queryClient = useQueryClient();
  const { mutateRoom } = useClearUnread();

  // Infinite query for paginated rooms
  const { data, isLoading, isError, fetchNextPage, hasNextPage } =
    useInfiniteChatRooms(patientId, true);

  // Flatten all loaded pages and normalize room shape for UI
  const rooms = useMemo(() => {
    if (!data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.pages.flat().map((room: any) => ({
      id: room.id,
      category: room.category,
      created_at: room.created_at || null,
      last_admin_read_at: room.last_admin_read_at || null,
      last_user_read_at:
        room.last_user_read_at || room.last_patient_read_at || null,
      patient_id: room.patient_id || null,
      user_name: room.patient_full_name,
      latest_message_created_at: room.latest_message_created_at || null,
      latest_message: room.latest_message || "",
      latest_message_sender_full_name:
        room.latest_message_sender_full_name || "",
      latest_message_sender_id: room.latest_message_sender_id || "",
    }));
  }, [data]);

  // Get admin user id from store
  const adminId = useUserStore((s) => s.user?.id || "");

  // Realtime: move room to top on new message (if loaded)
  const handleNewMessage = useCallback(
    async (roomId: string, messageCreatedAt?: string) => {
      // Always refetch all rooms using the RPC (invalidate query), regardless of whether the room is in the list
      queryClient.invalidateQueries({
        queryKey: ["chat-rooms-infinite"],
      });
      // Optionally, you can also invalidate unread count for that room
      queryClient.invalidateQueries({
        queryKey: ["unread-count"],
      });
      // If the admin is currently viewing this room, update last_admin_read_at in the DB
      if (currentRoomId === roomId) {
        console.log("---->currentroomId", currentRoomId);
        console.log("->>>>>", roomId, messageCreatedAt);
        mutateRoom(roomId, messageCreatedAt);
      }
      console.log("---->currentroomId", currentRoomId);
      console.log("->>>>>", roomId, messageCreatedAt);
      return;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, currentRoomId]
  );
  // Update useChatRoomsRealtime to pass messageCreatedAt if available
  useChatRoomsRealtime(handleNewMessage);

  function ChatRoomListItem({
    room,
    currentRoomId,
  }: {
    room: Tables<"chat_room"> & {
      latest_message_created_at?: string | null;
      user_name?: string;
      latest_message?: string;
      latest_message_sender_full_name?: string;
      latest_message_sender_id?: string;
      category?: string;
    };
    currentRoomId: string | null;
  }) {
    const { data: unreadCount, isLoading } = useUnreadCount(
      room.id,
      adminId,
      room.last_admin_read_at
    );

    // Determine if the latest message was sent by the logged-in user
    const isLatestMessageFromMe =
      room.latest_message_sender_id &&
      room.latest_message_sender_id === adminId;

    // Highlight if there is a new message (unreadCount > 0)
    const hasNewMessage = !isLoading && unreadCount! > 0;

    const handleSelect = async () => {
      setCurrentRoom(room.id, room.user_name || null, room.category || null);
      // Update last_admin_read_at to latest message when room is selected
      if (room.latest_message_created_at) {
        mutateRoom(room.id, room.latest_message_created_at);
      }
    };

    return (
      <li key={room.id} className="relative">
        <button
          className={`w-full text-left px-3 md:px-4 py-2 md:py-3 transition-colors flex items-start gap-2 md:gap-3 rounded-md min-h-[60px] md:min-h-[80px]
            ${currentRoomId === room.id ? "bg-blue-100 font-semibold" : ""}
            hover:bg-blue-50
          `}
          onClick={handleSelect}
          aria-current={currentRoomId === room.id}
        >
          {/* Main content area */}
          <div
            className={`flex flex-col flex-1 min-w-0 ${
              hasNewMessage ? "font-bold text-gray-900" : ""
            }`}
          >
            {/* Category and User Name Row */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex flex-col md:gap-2 min-w-0 flex-1">
                <span
                  className={`text-xs text-blue-600 font-medium truncate ${
                    hasNewMessage ? "text-blue-700" : ""
                  }`}
                >
                  {room.category || "-"}
                  {/* 카테고리 (Category) */}
                </span>
                <span
                  className={`text-sm md:text-base font-semibold truncate ${
                    hasNewMessage ? "text-gray-900" : "text-gray-900"
                  }`}
                >
                  {room.user_name || "Unknown"}
                  {/* 사용자 이름 (User Name) */}
                </span>
              </div>

              {/* Time stamp - show on mobile top right, hide on desktop */}
              {room.latest_message_created_at && (
                <span
                  className={`text-xs shrink-0 md:hidden ${
                    hasNewMessage ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {new Date(room.latest_message_created_at).toLocaleString(
                    "ko-KR",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              )}
            </div>

            {/* Latest message and sender */}
            {room.latest_message && (
              <div
                className={`text-xs flex items-start justify-between gap-2 ${
                  hasNewMessage
                    ? "text-blue-700 font-semibold"
                    : "text-gray-500"
                } md:mt-0.5`}
              >
                <div className="flex-1 ">
                  <span
                    className={`font-semibold ${
                      hasNewMessage ? "text-blue-800" : "text-gray-700"
                    }`}
                  >
                    {isLatestMessageFromMe
                      ? "나"
                      : room.latest_message_sender_full_name || "-"}
                  </span>
                  {": "}
                  <span className="truncate md:block md:max-h-8 md:overflow-hidden md:leading-4">
                    {room.latest_message}
                  </span>
                </div>

                {/* Time stamp - show on desktop next to message */}
                {room.latest_message_created_at && (
                  <span
                    className={`text-xs shrink-0 hidden md:block ${
                      hasNewMessage ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    {new Date(room.latest_message_created_at).toLocaleString(
                      "ko-KR",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right side indicators */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {isLoading && (
              <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
            )}
            {/* Only show badge if unreadCount > 0 */}
            {hasNewMessage && (
              <span className="inline-block min-w-[18px] md:min-w-[20px] px-1.5 md:px-2 py-0.5 rounded-full bg-red-500 text-white text-xs text-center">
                {unreadCount}
              </span>
            )}
          </div>
        </button>
      </li>
    );
  }

  // Type for chat room search result (from fetchRoomsByLatestMessage)
  type ChatRoomSearchResult = {
    id: string;
    category: string;
    patient_full_name: string;
    last_admin_read_at: string;
    last_patient_read_at: string;
    latest_message_created_at: string;
    latest_message?: string;
    latest_message_sender_full_name?: string;
    latest_message_sender_id?: string;
  };

  return (
    <aside className="h-full border-r bg-white flex flex-col w-full min-w-0 max-w-full md:w-64 md:min-w-[200px] md:max-w-xs">
      <div className="p-4 font-bold pt-10 text-lg border-b shrink-0">
        채팅방 목록 {/* Chat Room List */}
      </div>
      <div className="p-3 border-b bg-white sticky top-0 z-10 shrink-0">
        <Input
          type="text"
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 text-sm"
          placeholder="이름으로 채팅방 검색..." // Search chat rooms by name...
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search chat rooms by user name"
        />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <ul className="h-full">
          {search.length > 0 ? (
            isSearchLoading ? (
              <li className="px-4 py-3 text-gray-400">
                검색 중... {/* Searching... */}
              </li>
            ) : isSearchError ? (
              <li className="px-4 py-3 text-red-500">
                검색 오류 {/* Search error */}
              </li>
            ) : searchResults && searchResults.length === 0 ? (
              <li className="px-4 py-3 text-gray-400">
                검색 결과 없음 {/* No results */}
              </li>
            ) : (
              searchResults?.map((room: ChatRoomSearchResult) => (
                <ChatRoomListItem
                  key={room.id}
                  room={{
                    id: room.id,
                    category: room.category,
                    created_at: "", // Not available from search result
                    last_admin_read_at: room.last_admin_read_at || null,
                    last_user_read_at: room.last_patient_read_at || null,
                    patient_id: "", // Not available from search result
                    user_name: room.patient_full_name, // normalize for UI
                    latest_message_created_at: room.latest_message_created_at,
                    latest_message: room.latest_message || "",
                    latest_message_sender_full_name:
                      room.latest_message_sender_full_name || "",
                    latest_message_sender_id:
                      room.latest_message_sender_id || "",
                  }}
                  currentRoomId={currentRoomId}
                />
              ))
            )
          ) : (
            <>
              {isLoading && (
                <li className="px-4 py-3 text-gray-400">Loading...</li>
              )}
              {isError && (
                <li className="px-4 py-3 text-red-500">Error loading rooms</li>
              )}
              {rooms && rooms.length === 0 && (
                <li className="px-4 py-3 text-gray-400">No rooms</li>
              )}
              {rooms &&
                rooms.map((room) => (
                  <ChatRoomListItem
                    key={room.id}
                    room={room}
                    currentRoomId={currentRoomId}
                  />
                ))}
            </>
          )}
        </ul>
      </div>
      {hasNextPage && (
        <div className="shrink-0">
          <button
            className="w-full py-3 border-t text-blue-600 font-semibold hover:bg-blue-50"
            onClick={() => fetchNextPage()}
          >
            더 보기 {/* Load more */}
          </button>
        </div>
      )}
    </aside>
  );
}
