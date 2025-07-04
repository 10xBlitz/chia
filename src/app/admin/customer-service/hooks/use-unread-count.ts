import { useQuery } from "@tanstack/react-query";
import { fetchUnreadMessageCountOfRoom } from "@/lib/supabase/services/messages.services";

export function useUnreadCount(
  roomId: string,
  adminId: string,
  lastAdminReadAt: string | null
) {
  return useQuery({
    queryKey: ["unread-count", roomId, adminId, lastAdminReadAt],
    queryFn: async () => {
      if (!roomId || !adminId || !lastAdminReadAt) return 0;
      return fetchUnreadMessageCountOfRoom(adminId, roomId, lastAdminReadAt);
    },
    enabled: !!roomId && !!adminId && !!lastAdminReadAt,
    staleTime: 1000 * 10, // 10 seconds
  });
}
