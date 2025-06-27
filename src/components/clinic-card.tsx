import Image from "next/image";
import { useEffect, useState } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import {
  addClinicToFavorites,
  checkIfClinicIsFavorite,
  removeClinicFromFavorites,
} from "@/lib/supabase/services/favorites.service";
import CornerBookmarkButton from "@/components/corner-bookmark-button";
import { cn } from "@/lib/utils";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export interface ClinicCardProps {
  total_reviews: number;
  avg_reviews_per_treatment: number;
  clinic_name: string;
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
  showBookmark?: boolean;
}

export default function ClinicCard(props: ClinicCardProps) {
  const user = useUserStore((state) => state.user);
  const showBookmark = props.showBookmark ?? true;
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user?.id) return;
      const { isFavorite, favoriteId } = await checkIfClinicIsFavorite(
        user.id,
        props.id
      );
      setIsFavorite(isFavorite);
      setFavoriteId(favoriteId);
    };
    checkFavorite();
  }, [props.id, user?.id]);

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
      }
    }
  };

  // Add view count and redirect logic
  const handleCardClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!props.id) return;

    const { error } = await supabaseClient
      .from("clinic_view")
      .insert({ clinic_id: props.id, patient_id: user?.id || null });

    if (error) {
      console.error("Error logging clinic view:", error);
      toast.error("클리닉 조회에 실패했습니다."); // Failed to log clinic view
      return;
    }

    router.push(`/clinic/${props.id}`);
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
        {user?.id && user.role && showBookmark && (
          <CornerBookmarkButton
            isActive={isFavorite}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBookmarkClick(e);
            }}
            className="top-0 right-1"
            ariaLabel={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
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
