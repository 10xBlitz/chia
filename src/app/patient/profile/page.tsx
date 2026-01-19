"use client";

import BottomNavigation from "../../../components/bottom-navigation";
import { ReservationsIcon, FavoriteIcon, ReviewIcon } from "@/components/icons";
import { useUserStore } from "@/providers/user-store-provider";
import { useRouter } from "next/navigation";

import MyMenuPage from "@/components/my-menu-page";

const quickActions = [
  {
    href: "/patient/reservation?accessed_from_profile=true",
    icon: ReservationsIcon,
    label: "예약", // Reservation
  },
  {
    href: "/patient/review",
    icon: ReviewIcon,
    label: "리뷰", // Review
  },
  {
    href: "/patient/profile/favorites",
    icon: FavoriteIcon,
    label: "즐겨찾기", // Favorites
  },
];

export default function PatientProfilePage() {
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  // Redirect to login if not authenticated
  if (!user || !user.id) {
    router.push("/auth/login");
    return (
      <>
        <div className="flex flex-col min-h-screen">
          {/* Header skeleton */}
          <header className="py-4 px-5">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
          </header>

          {/* Content skeleton */}
          <div className="flex-1 p-5 space-y-4">
            <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </>
    );
  }

  return (
    <>
      <MyMenuPage
        actions={quickActions}
        editProfileLink="/patient/profile/edit-profile"
        serviceInquiryLink="/patient/profile/chat"
        termsOfServiceLink="/terms-of-service"
      />
      <BottomNavigation />
    </>
  );
}
