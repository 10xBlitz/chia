import { cn } from "@/lib/utils";
import { Metadata } from "next";
import React from "react";

interface MobileLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export const metadata: Metadata = {
  title: "치아 - 치과 플랫폼", // 치과 플랫폼 (Dental Clinic Platform)
  description:
    "치아는 전국 치과 정보, 리뷰, 예약을 제공하는 치과 플랫폼입니다.", // Dental clinic platform for clinics, reviews, and reservations

  openGraph: {
    title: "치아 - 치과 플랫폼", // Dental Clinic Platform
    description:
      "치아는 전국 치과 정보, 리뷰, 예약을 제공하는 치과 플랫폼입니다.", // Dental clinic platform for clinics, reviews, and reservations
    url: "https://chia.ai.kr/", // Absolute URL for OG
    siteName: "치아 (Chia)",
    images: [
      {
        url: "https://chia.ai.kr/images/chia-logo.png", // Absolute URL for OG image
        width: 1200,
        height: 630,
        alt: "치아 로고", // Chia logo
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "치아 - 치과 플랫폼", // Dental Clinic Platform
    description:
      "치아는 전국 치과 정보, 리뷰, 예약을 제공하는 치과 플랫폼입니다.", // Dental clinic platform for clinics, reviews, and reservations
    images: [
      "https://chia.ai.kr/images/chia-logo.png", // Absolute URL for Twitter image
    ],
  },
};

const MobileLayout: React.FC<MobileLayoutProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        className,
        "px-5 pt-4 max-w-[450px] min-h-dvh mx-auto bg-white shadow-lg"
      )}
    >
      {children}
    </div>
  );
};

export default MobileLayout;
