"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { supabaseClient } from "@/lib/supabase/client";
import Image from "next/image";
import BookmarkButton from "@/components/bookmark";
import { removeClinicFromFavorites } from "@/lib/supabase/services/favorites.service";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BackButton from "@/components/back-button";

type Clinic = {
  id: string;
  clinic_name: string;
  pictures: string[] | null;
  region: string;
  views: number;
  clinic_treatment?: { review: { rating: number }[] }[];
  reviews: { rating: number }[];
};

type FavoriteClinic = {
  id: string;
  clinic_id: string;
  clinic: Clinic;
};

export default function FavoriteClinicsPage() {
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch favorite clinics with clinic info and reviews
  const { data: favorites, isLoading } = useQuery<FavoriteClinic[]>({
    queryKey: ["favorite-clinics", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabaseClient
        .from("favorite_clinic")
        .select(
          `id, clinic_id, clinic:clinic_id (
            id, clinic_name, pictures, region, views,
            clinic_treatment(
              review(rating)
            )
          )`
        )
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false });

      if (error) return [];
      // Flatten reviews for each clinic
      return (data || []).map((fav) => {
        const reviews =
          fav.clinic?.clinic_treatment?.flatMap((ct) => ct.review ?? []) || [];
        return {
          ...fav,
          clinic: {
            ...fav.clinic,
            reviews,
          },
        };
      });
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
  };

  return (
    <div className="flex flex-col">
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
        ) : !favorites || favorites.length === 0 ? (
          <div className="text-center py-10">
            즐겨찾는 병원이 없습니다. {/* No favorites */}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {favorites.map((fav) => {
              const clinic = fav.clinic;
              const avgRating =
                clinic.reviews.length > 0
                  ? (
                      clinic.reviews.reduce(
                        (sum, r) => sum + (r.rating ?? 0),
                        0
                      ) / clinic.reviews.length
                    ).toFixed(1)
                  : "-";
              return (
                <div
                  key={fav.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden">
                    {clinic.pictures && clinic.pictures[0] && (
                      <Image
                        src={clinic.pictures[0]}
                        alt={clinic.clinic_name}
                        fill
                        className="object-cover"
                        onClick={() =>
                          router.push(`/patient/home/${clinic.id}`)
                        }
                        style={{ cursor: "pointer" }}
                        priority
                      />
                    )}
                    <BookmarkButton
                      isActive={true}
                      handleBookmarkClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await handleRemove(fav.id);
                      }}
                      className="absolute top-2 right-2 z-10 rounded-full p-1"
                      notActiveStyle="text-white"
                      data-bookmark
                    />
                  </div>
                  <div
                    className="px-2 pt-3 pb-2 cursor-pointer"
                    onClick={() => router.push(`/patient/home/${clinic.id}`)}
                  >
                    <div className="font-semibold text-base mb-1">
                      {clinic.clinic_name}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span>{avgRating}</span>
                      <span className="ml-1">({clinic.reviews.length})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
