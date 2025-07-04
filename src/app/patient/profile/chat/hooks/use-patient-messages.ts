import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMessagesOfRoom } from "@/lib/supabase/services/messages.services";

const PAGE_SIZE = 20;

export function usePatientMessages(roomId?: string) {
  return useInfiniteQuery({
    queryKey: ["patient-chat-messages", roomId],
    queryFn: async ({ pageParam = undefined }) => {
      return fetchMessagesOfRoom(roomId!, pageParam as string | undefined);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getNextPageParam: (lastPage: any[] | undefined) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[lastPage.length - 1].createdAt;
    },
    enabled: !!roomId,
    staleTime: 10000,
    initialPageParam: undefined,
  });
}
