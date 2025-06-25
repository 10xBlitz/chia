import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMessagesOfRoom } from "@/lib/supabase/services/messages.services";

export function useInfiniteMessages(roomId: string | null) {
  return useInfiniteQuery({
    queryKey: ["messages", roomId],
    queryFn: async ({ pageParam = undefined }) => {
      return fetchMessagesOfRoom(roomId!, pageParam as string | undefined);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getNextPageParam: (lastPage: any[] | undefined) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return lastPage[lastPage.length - 1].createdAt;
    },
    enabled: !!roomId,
    staleTime: 1000 * 5,
    initialPageParam: undefined,
  });
}
