import { useQuery } from "@tanstack/react-query";
import { fetchUnreadMessageCountOfRoom } from "@/lib/supabase/services/messages.services";

export function useUnreadCount(
  roomId: string,
  userId: string,
  lastPatientReadAt: string | null
) {
  return useQuery({
    queryKey: ["unreadCount", roomId, userId, lastPatientReadAt],
    queryFn: async () => {
      if (!roomId || !userId || !lastPatientReadAt) return 0;
      return fetchUnreadMessageCountOfRoom(userId, roomId, lastPatientReadAt);
    },
    enabled: !!roomId && !!userId && !!lastPatientReadAt,
    staleTime: 10000,
  });
}
