import Image from "next/image";
import { useEffect, useState } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import {
  addClinicToFavorites,
  checkIfClinicIsFavorite,
  removeClinicFromFavorites,
} from "@/lib/supabase/services/favorites.service";
import Link from "next/link";
import BookmarkButton from "@/components/bookmark";

interface ClinicCardProps {
  total_reviews: number;
  avg_reviews_per_treatment: number;
  clinic_name: string;
  contact_number: string;
  created_at: string;
  id: string;
  link: string | null;
  location: string;
  opening_date: string;
  pictures: string[] | null;
  region: string;
}

export default function ClinicCard(clinic: ClinicCardProps) {
  const user = useUserStore((state) => state.user);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    const checkFavorite = async () => {
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
      const data = await addClinicToFavorites(user.id, clinic.id);
      if (data) {
        setIsFavorite(true);
        setFavoriteId(data);
      }
    }
  };

  const avgReviews = clinic.avg_reviews_per_treatment
    ? clinic.avg_reviews_per_treatment.toFixed(1)
    : "0.0";
  const totalReviews = clinic.total_reviews || 0;

  return (
    <Link
      href={`/patient/home/${clinic.id}`}
      className="p-4 border-b"
      onClick={(e) => {
        // Prevent navigation if the click originated from the bookmark button
        const target = e.target as HTMLElement;
        if (
          target.closest("button[data-bookmark]") ||
          target.getAttribute("data-bookmark") !== null
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
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
          <BookmarkButton
            isActive={isFavorite}
            handleBookmarkClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBookmarkClick(e);
            }}
            notActiveStyle="text-white"
            className="absolute top-2 right-2 z-10 rounded-full p-1"
            data-bookmark
          />
        )}
      </div>
      <div className="font-semibold text-lg">{clinic.clinic_name}</div>
      <div className="flex items-center text-gray-500 text-base mt-1">
        <span className="text-yellow-500 mr-1">★</span>
        <span>{avgReviews}</span>
        <span className="ml-1">({totalReviews})</span>
      </div>
    </Link>
  );
}
