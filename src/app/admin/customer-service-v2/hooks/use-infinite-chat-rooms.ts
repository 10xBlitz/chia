import { useInfiniteQuery } from "@tanstack/react-query";
import {
  fetchRooms,
  fetchRoomsByLatestMessage,
} from "@/lib/supabase/services/room.services";

const PAGE_SIZE = 20;

/**
 * @param patientId Optional patient ID to filter rooms
 * @param useLatestMessageOrder If true, use fetchRoomsByLatestMessage for ordering
 */
export function useInfiniteChatRooms(
  patientId?: string,
  useLatestMessageOrder: boolean = false
) {
  return useInfiniteQuery({
    queryKey: ["chat-rooms-infinite", patientId, useLatestMessageOrder],
    queryFn: async ({ pageParam = 0 }) => {
      if (useLatestMessageOrder) {
        // Use the RPC for ordering by latest message
        return fetchRoomsByLatestMessage(
          undefined,
          PAGE_SIZE,
          pageParam * PAGE_SIZE
        );
      }
      // Default: fallback to old method
      return fetchRooms(
        { ...(patientId ? { patient_id: patientId } : {}) },
        PAGE_SIZE,
        pageParam * PAGE_SIZE
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    staleTime: 1000 * 30,
  });
}
