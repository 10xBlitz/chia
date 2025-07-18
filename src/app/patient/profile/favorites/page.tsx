"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BackButton from "@/components/back-button";
import { useState } from "react";
import { removeClinicFromFavorites } from "@/lib/supabase/services/favorites.service";
import { getPaginatedFavoriteClinics } from "@/lib/supabase/services/favorite-clinics.services";
import ClinicCard from "@/components/clinic-card";
import { Button } from "@/components/ui/button";
import { BookmarkCheckIcon } from "lucide-react";
import ClinicCardSkeleton from "@/components/loading-skeletons/clinic-card-skeleton";
import BottomNavigation from "@/components/bottom-navigation";
import { ConfirmModal } from "@/components/modals/confirm-modal";

export default function FavoriteClinicsPage() {
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState<{
    id: string;
    clinic_name: string;
  }>();

  // Fetch favorite clinics with review stats using the service
  const { data, isLoading } = useQuery({
    queryKey: ["favorite-clinics", user?.id],
    queryFn: async () => {
      const result = await getPaginatedFavoriteClinics(1, 1000, {
        user_id: user?.id,
      });
      // Map to expected FavoriteClinic shape
      return result.data;
    },
    enabled: !!user?.id,
  });

  // Remove from favorites
  const mutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      await removeClinicFromFavorites(favoriteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["favorite-clinics", user?.id],
      });
    },
  });

  const handleRemove = async (favoriteId: string) => {
    mutation.mutate(favoriteId);
    setModalOpen(false);
    setSelectedFavorite(undefined);
  };

  return (
    <div className="flex flex-col">
      {selectedFavorite && (
        <ConfirmModal
          open={modalOpen}
          title={`${selectedFavorite.clinic_name} 병원을 즐겨찾기에서 삭제하시겠습니까?`} // Are you sure you want to remove {clinic_name} from favorites?
          description="즐겨찾기에서 삭제하면 다시 추가해야 합니다." // Removing from favorites will require re-adding.
          onCancel={() => {
            setModalOpen(false);
            setSelectedFavorite(undefined);
          }}
          onConfirm={() =>
            selectedFavorite && handleRemove(selectedFavorite.id)
          }
        />
      )}
      {/* Header */}
      <header className="flex flex-col gap-9 font-bold mb-3 font-pretendard-600 text-lg">
        <BackButton />
        <div className="flex justify-between">
          <span className="font-bold text-base">
            즐겨찾는 병원 {/* Favorite Clinics */}
          </span>
          <div className="flex justify-end items-center mb-2  ">
            위치순 {/* By Location */}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col mb-12">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <ClinicCardSkeleton key={index} />
          ))}

        {data && (
          <div className="flex flex-col gap-6">
            {data.map((fav) => (
              <div key={fav.id} className="relative">
                <ClinicCard {...fav} id={fav.clinic_id} showBookmark={false} />
                <Button
                  className="absolute top-6 w-10 h-10 right-6 z-10 p-1 text-white "
                  variant={"ghost"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedFavorite({
                      id: fav.id,
                      clinic_name: fav.clinic_name,
                    });
                    setModalOpen(true);
                  }}
                  aria-label="Remove from favorites"
                >
                  <BookmarkCheckIcon
                    strokeWidth={1}
                    className={`fill-blue-500 size-8 text-black `}
                  />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNavigation forceActiveIndex={3} />
    </div>
  );
}
