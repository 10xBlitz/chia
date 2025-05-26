import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/providers/user-store-provider";
import {
  addClinicToFavorites,
  checkIfClinicIsFavorite,
  removeClinicFromFavorites,
} from "@/lib/supabase/services/favorites.service";
import { Bookmark, BookmarkCheck } from "lucide-react";

interface ClinicCardProps {
  id: string;
  clinic_name: string;
  location: string;
  contact_number: string;
  link: string | null;
  pictures: string[] | null;
  views: number;
  opening_date: string;
  region: string;
  created_at: string;
  clinic_treatment: Array<{
    id: string;
    reservation: Array<{
      id: string;
      review: Array<{
        id: string;
        rating: number | null;
        review: string | null;
        created_at: string;
        reservation_id: string;
      }>;
    }>;
  }>;
}

export default function ClinicCard(clinic: ClinicCardProps) {
  const supabase = createClient();
  const user = useUserStore((state) => state.user);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    const checkFavorite = async () => {
      console.log("Checking favorite status for clinic:", clinic.id);
      console.log("Current user ID:", user?.id);
      if (!user?.id) return;
      const { isFavorite, favoriteId } = await checkIfClinicIsFavorite(
        user.id,
        clinic.id
      );
      setIsFavorite(isFavorite);
      setFavoriteId(favoriteId);
    };
    checkFavorite();
  }, [clinic.id, user?.id]);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (isFavorite && favoriteId) {
      await removeClinicFromFavorites(favoriteId);
      setIsFavorite(false);
      setFavoriteId(null);
    } else {
      console.log("Adding clinic to favorites");
      console.log("User ID:", user.id);
      const data = await addClinicToFavorites(user.id, clinic.id);
      if (data) {
        setIsFavorite(true);
        setFavoriteId(data);
      }
    }
  };

  // Get all reviews
  const allReviews =
    clinic.clinic_treatment?.flatMap(
      (ct) => ct.reservation?.flatMap((res) => res.review ?? []) ?? []
    ) ?? [];
  const avgRating =
    allReviews.length > 0
      ? (
          allReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
          allReviews.length
        ).toFixed(1)
      : "-";

  return (
    <div className="p-4 border-b">
      <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gray-200 mb-3">
        {clinic.pictures && clinic.pictures[0] && (
          <Image
            src={clinic.pictures[0]}
            alt={clinic.clinic_name}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/auth-main.svg";
            }}
          />
        )}
        {user?.id && (
          <button
            className="absolute top-3 right-3 z-10 rounded-full p-1"
            onClick={handleBookmarkClick}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            {isFavorite ? (
              <BookmarkCheck size={28} className="fill-yellow" />
            ) : (
              <Bookmark size={28} className="fill-white text-white" />
            )}
          </button>
        )}
      </div>
      <div className="font-semibold text-lg">{clinic.clinic_name}</div>
      <div className="flex items-center text-gray-500 text-base mt-1">
        <span className="text-yellow-500 mr-1">★</span>
        <span>{avgRating}</span>
        <span className="ml-1">({allReviews.length})</span>
      </div>
    </div>
  );
}
