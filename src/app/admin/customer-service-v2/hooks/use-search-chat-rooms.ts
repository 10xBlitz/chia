import { useQuery } from "@tanstack/react-query";
import { fetchRoomsByLatestMessage } from "@/lib/supabase/services/room.services";

/**
 * Search chat rooms by user name (patient_full_name) using the Supabase RPC.
 * @param search Search string for user name
 * @param limit Number of results to fetch
 */
export function useSearchChatRooms(search: string, limit = 20) {
  return useQuery({
    queryKey: ["search-chat-rooms", search, limit],
    queryFn: () => fetchRoomsByLatestMessage(search, limit, 0),
    enabled: !!search && search.length > 0,
    staleTime: 1000 * 60, // 1 minute
  });
}
