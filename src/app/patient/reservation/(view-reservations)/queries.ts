import { useInfiniteQuery } from "@tanstack/react-query";
import { getPaginatedReservations } from "@/lib/supabase/services/reservations.services";

// Constants
const PAGE_SIZE = 10; // Number of reservations per page

/**
 * Custom hook for fetching patient reservations with infinite scroll
 * @param userId - The patient's user ID
 * @returns Infinite query result with flattened reservations data
 */
export const useReservationsInfiniteQuery = (userId: string | undefined) => {
  const query = useInfiniteQuery({
    queryKey: ["reservations", userId, PAGE_SIZE],
    queryFn: async ({ pageParam = 1 }) =>
      getPaginatedReservations(pageParam, PAGE_SIZE, {
        patient_id: userId,
      }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.data?.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    enabled: !!userId,
    initialPageParam: 1,
  });

  // Flatten all loaded reservations from pages into a single array
  const allReservations = query.data?.pages.flatMap((page) => page.data) || [];

  return {
    ...query,
    allReservations,
  };
};