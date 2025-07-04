import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchRoomsByLatestMessage } from "@/lib/supabase/services/room.services";

const PAGE_SIZE = 20;

export function usePatientRooms(patientId?: string) {
  return useInfiniteQuery({
    queryKey: ["patient-chat-rooms", patientId],
    queryFn: async ({ pageParam = 0 }) => {
      // Use the RPC to fetch rooms for this patient, ordered by latest message
      return fetchRoomsByLatestMessage(
        undefined,
        PAGE_SIZE,
        pageParam * PAGE_SIZE
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    enabled: !!patientId,
    staleTime: 10000,
    initialPageParam: 0,
  });
}
