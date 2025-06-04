"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BackButton from "@/components/back-button";
import RemoveFavoriteModal from "./remove-favorite-modal";
import { useState } from "react";
import { removeClinicFromFavorites } from "@/lib/supabase/services/favorites.service";
import { getPaginatedFavoriteClinics } from "@/lib/supabase/services/favorite-clinics.services";
import ClinicCard from "@/components/clinic-card";

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
      if (!user?.id) return [];
      // You can add pagination/filters as needed
      const result = await getPaginatedFavoriteClinics(1, 1000, {});
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
        <RemoveFavoriteModal
          open={modalOpen}
          clinicName={selectedFavorite?.clinic_name || ""}
          loading={mutation.status === "pending"}
          onCancel={() => {
            setModalOpen(false);
            setSelectedFavorite(undefined);
          }}
          onConfirm={() =>
            selectedFavorite && handleRemove(selectedFavorite?.id)
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
      <main className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="text-center py-10">로딩 중... {/* Loading... */}</div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-10">
            즐겨찾는 병원이 없습니다. {/* No favorites */}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {data.map((fav) => (
              <div key={fav.id} className="relative">
                <ClinicCard {...fav} />
                <button
                  className="absolute top-2 right-2 z-10 rounded-full p-1 bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedFavorite(fav);
                    setModalOpen(true);
                  }}
                  aria-label="Remove from favorites"
                >
                  <span className="text-red-500 font-bold">✕</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
