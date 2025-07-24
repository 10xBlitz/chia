import Image from "next/image";
import { useEffect, useState } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import {
  addClinicToFavorites,
  checkIfClinicIsFavorite,
  removeClinicFromFavorites,
} from "@/lib/supabase/services/favorites.service";
import { cn } from "@/lib/utils";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import BookmarkButton from "./bookmark";
import { Enums } from "@/lib/supabase/types";
import { useQueryClient } from "@tanstack/react-query";

export interface ClinicCardProps {
  total_reviews: number;
  avg_reviews_per_treatment: number;
  clinic_name: string;
  introduction: string | null;
  contact_number: string;
  created_at: string;
  id: string;
  link: string | null;
  opening_date: string;
  pictures: string[] | null;
  full_address: string;
  detail_address?: string | null;
  city: string;
  region: string;
  className?: string;
  status: Enums<"record_status">;
  showBookmark?: boolean;
  notification_recipient_user_id?: string | null;
}

export default function ClinicCard(props: ClinicCardProps) {
  const user = useUserStore((state) => state.user);
  const showBookmark = props.showBookmark ?? true;
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user?.id && !user?.work_place) return;
      const { isFavorite, favoriteId } = await checkIfClinicIsFavorite(
        user.id as string,
        props.id
      );
      setIsFavorite(isFavorite);
      setFavoriteId(favoriteId);
    };
    checkFavorite();
  }, [props.id, user?.id, user?.work_place]);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (isFavorite && favoriteId) {
      await removeClinicFromFavorites(favoriteId);
      setIsFavorite(false);
      setFavoriteId(null);
    } else {
      const data = await addClinicToFavorites(user.id, props.id);
      if (data) {
        setIsFavorite(true);
        setFavoriteId(data);
        queryClient.invalidateQueries({
          queryKey: ["favorite-clinics"],
          type: "all",
        });
      }
    }
  };

  // Add view count and redirect logic
  const handleCardClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!props.id) return;

    const isLoggedIn = user?.id && user?.role && user.work_place;

    supabaseClient
      .from("clinic_view")
      .insert({ clinic_id: props.id, patient_id: isLoggedIn ? user.id : null });

    router.push(`/clinic?clinic_id=${props.id}`);
  };

  const avgReviews = props.avg_reviews_per_treatment
    ? props.avg_reviews_per_treatment.toFixed(1)
    : "0.0";
  const totalReviews = props.total_reviews || 0;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn("p-4 border-b cursor-pointer", props.className)}
      onClick={handleCardClick}
    >
      <div className="relative w-full h-56 rounded-md overflow-hidden bg-gray-200 mb-3">
        {props.pictures && props.pictures[0] && (
          <Image
            src={props.pictures[0]}
            alt={props.clinic_name}
            fill
            className="object-cover"
          />
        )}
        {user?.id && user.role && user.work_place && showBookmark && (
          // <CornerBookmarkButton
          //   isActive={isFavorite}
          //   onClick={(e) => {
          //     e.preventDefault();
          //     e.stopPropagation();
          //     handleBookmarkClick(e);
          //   }}
          //   className="top-0 right-1"
          //   ariaLabel={
          //     isFavorite ? "Remove from favorites" : "Add to favorites"
          //   }
          // />

          <BookmarkButton
            isActive={isFavorite}
            handleBookmarkClick={handleBookmarkClick}
            className="absolute top-2 right-1"
            activeStyle="group-hover:fill-blue-600 fill-blue-500 stroke-1 !size-8"
            notActiveStyle="group-hover:fill-blue-600 group-hover:text-blue-700 group-hover:stroke-1 stroke-2 text-white !size-8"
          />
        )}
      </div>
      <div className="font-semibold text-lg">{props.clinic_name}</div>
      <div className="flex items-center text-gray-500 text-base mt-1">
        <span className="text-yellow-500 mr-1">★</span>
        <span>{avgReviews}</span>
        <span className="ml-1">({totalReviews})</span>
      </div>
    </div>
  );
}
