"use client";

import MyMenuPage from "@/components/my-menu-page";
import React from "react";
import {
  ReservationsIcon,
  ReviewIcon,
  QuotationIcon,
} from "@/components/icons";

const quickActions = [
  {
    href: "/dentist/reservation",
    icon: ReservationsIcon,
    label: "예약", // Reservation
  },
  {
    href: "/dentist/review",
    icon: ReviewIcon,
    label: "리뷰", // Review
  },
  {
    href: "/dentist/quotation",
    icon: QuotationIcon,
    label: "즐겨찾기", // Favorites
  },
];

const DentistHome = () => {
  return (
    <MyMenuPage editProfileLink="/dentist/profile" actions={quickActions} />
  );
};

export default DentistHome;
