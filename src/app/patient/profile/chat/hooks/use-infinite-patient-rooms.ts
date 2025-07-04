import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchRooms } from "@/lib/supabase/services/room.services";

const PAGE_SIZE = 20;

export function useInfinitePatientRooms(patientId?: string) {
  return useInfiniteQuery({
    queryKey: ["patient-chat-rooms", patientId],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchRooms(
        { patient_id: patientId },
        PAGE_SIZE,
        Number(pageParam) * PAGE_SIZE
      );
    },
    initialPageParam: 0, // Required by TanStack Query v5
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    enabled: !!patientId,
    staleTime: 10000,
  });
}
