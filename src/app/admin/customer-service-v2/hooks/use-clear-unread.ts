import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLastAdminReadAt } from "@/lib/supabase/services/room.services";

/**
 * Hook to clear unread count for a chat room by updating last_admin_read_at.
 * @returns { mutateRoom: (roomId: string) => void }
 */
export function useClearUnread() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    // Accept optional date
    mutationFn: async (params: { roomId: string; date?: string }) => {
      const { roomId, date } = params;
      if (!roomId) return;
      await updateLastAdminReadAt(roomId, date);
    },
    onSuccess: (_data, variables) => {
      // Invalidate unread count for this room (use camelCase to match useUnreadCount)
      const roomId = variables.roomId;
      queryClient.invalidateQueries({
        queryKey: ["unreadCount", roomId],
        exact: false,
      });
      // Optionally, refetch chat rooms to update last_admin_read_at
      queryClient.invalidateQueries({
        queryKey: ["chat-rooms-infinite"],
        exact: false,
      });
    },
  });
  return {
    mutateRoom: (roomId: string, date?: string) =>
      mutation.mutate({ roomId, date }),
    ...mutation,
  };
}
