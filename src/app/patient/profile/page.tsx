"use client";

import BottomNavigation from "../../../components/bottom-navigation";
import { ReservationsIcon, FavoriteIcon, ReviewIcon } from "@/components/icons";

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
  return (
    <>
      <MyMenuPage
        actions={quickActions}
        editProfileLink="/patient/profile/edit-profile"
        serviceInquiryLink="/patient/profile/chat-v2"
        termsOfServiceLink="/patient/profile/terms-of-service"
      />
      <BottomNavigation />
    </>
  );
}
