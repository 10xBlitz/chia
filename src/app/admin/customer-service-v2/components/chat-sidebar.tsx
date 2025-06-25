import React, { useCallback, useMemo } from "react";
import { useInfiniteChatRooms } from "../hooks/use-infinite-chat-rooms";
import { useChatRoomsRealtime } from "../hooks/use-chat-rooms-realtime";
import { Tables } from "@/lib/supabase/types";
import { useUnreadCount } from "../hooks/use-unread-count";
import { useUserStore } from "@/providers/user-store-provider";
import { useRoomSelectionStore } from "../room-selection-context";
import { useQueryClient } from "@tanstack/react-query";
import { useClearUnread } from "../hooks/use-clear-unread";

interface ChatSidebarProps {
  patientId?: string;
}

export function ChatSidebar({ patientId }: ChatSidebarProps) {
  // Zustand store for room selection
  const currentRoomId = useRoomSelectionStore((s) => s.currentRoomId);
  const setCurrentRoomId = useRoomSelectionStore((s) => s.setCurrentRoomId);

  // TanStack Query client for manual invalidation
  const queryClient = useQueryClient();
  const { mutateRoom } = useClearUnread();

  // Infinite query for paginated rooms
  const { data, isLoading, isError, fetchNextPage, hasNextPage } =
    useInfiniteChatRooms(patientId, true);

  // Flatten all loaded pages and normalize room shape for UI
  const rooms = useMemo(() => {
    if (!data) return [];
    // Normalize all rooms to the expected shape for the UI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.pages.flat().map((room: any) => ({
      id: room.id,
      category: room.category,
      created_at: room.created_at || null,
      last_admin_read_at: room.last_admin_read_at || null,
      last_user_read_at:
        room.last_user_read_at || room.last_patient_read_at || null,
      patient_id: room.patient_id || null,
      latest_message_created_at: room.latest_message_created_at || null, // <-- add this
      // Optionally: add patient_full_name if needed for display
    }));
  }, [data]);

  // Get admin user id from store
  const adminId = useUserStore((s) => s.user?.id || "");

  // Realtime: move room to top on new message (if loaded)
  // Accept optional messageCreatedAt for optimistic update
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
    room: Tables<"chat_room"> & { latest_message_created_at?: string | null };
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
          className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
            currentRoomId === room.id ? "bg-blue-100 font-semibold" : ""
          }`}
          onClick={handleSelect}
          aria-current={currentRoomId === room.id}
        >
          {room.category || room.id}
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

  return (
    <aside className="w-64 min-w-[200px] max-w-xs h-full border-r bg-white flex flex-col">
      <div className="p-4 font-bold text-lg border-b">
        채팅방 목록 {/* Chat Room List */}
      </div>
      <ul className="flex-1 overflow-y-auto">
        {isLoading && <li className="px-4 py-3 text-gray-400">Loading...</li>}
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
