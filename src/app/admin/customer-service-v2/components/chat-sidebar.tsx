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
  const setCurrentRoomId = useRoomSelectionStore((s) => s.setCurrentRoomId);

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
      latest_message_created_at: room.latest_message_created_at || null, // <-- add this
      // Optionally: add patient_full_name if needed for display
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
        queryKey: ["unread-count", roomId],
      });
      // If the admin is currently viewing this room, update last_admin_read_at in the DB
      if (currentRoomId === roomId) {
        mutateRoom(roomId, messageCreatedAt);
      }
      return;
    },
    [queryClient, currentRoomId, mutateRoom]
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
    };
    currentRoomId: string | null;
  }) {
    const { data: unreadCount, isLoading } = useUnreadCount(
      room.id,
      adminId,
      room.last_admin_read_at
    );
    const handleSelect = async () => {
      setCurrentRoomId(room.id);
      // Update last_admin_read_at to latest message when room is selected
      if (room.latest_message_created_at) {
        mutateRoom(room.id, room.latest_message_created_at);
      }
    };
    return (
      <li key={room.id} className="relative">
        <button
          className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 ${
            currentRoomId === room.id ? "bg-blue-100 font-semibold" : ""
          }`}
          onClick={handleSelect}
          aria-current={currentRoomId === room.id}
        >
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs text-blue-600 font-medium truncate mb-0.5">
              {room.category || "-"}
              {/* 카테고리 (Category) */}
            </span>
            <span className="text-base text-gray-900 font-semibold truncate">
              {room.user_name || "Unknown"}
              {/* 사용자 이름 (User Name) */}
            </span>
          </div>
          {isLoading && (
            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-400 align-middle" />
          )}
          {/* Only show badge if unreadCount > 0 */}
          {!isLoading && unreadCount! > 0 && (
            <span className="ml-2 inline-block min-w-[20px] px-2 py-0.5 rounded-full bg-red-500 text-white text-xs text-center align-middle">
              {unreadCount}
            </span>
          )}
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
  };

  return (
    <aside className="w-64 min-w-[200px] max-w-xs h-full border-r bg-white flex flex-col">
      <div className="p-4 font-bold text-lg border-b">
        채팅방 목록 {/* Chat Room List */}
      </div>
      <div className="p-3 border-b bg-white sticky top-0 z-10">
        <Input
          type="text"
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 text-sm"
          placeholder="이름으로 채팅방 검색..." // Search chat rooms by name...
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search chat rooms by user name"
        />
      </div>
      <ul className="flex-1 overflow-y-auto">
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
      {hasNextPage && (
        <button
          className="w-full py-3 border-t text-blue-600 font-semibold hover:bg-blue-50"
          onClick={() => fetchNextPage()}
        >
          더 보기 {/* Load more */}
        </button>
      )}
    </aside>
  );
}
