import MobileLayout from "@/components/layout/mobile-layout";
import MainPage from "./main-component";
import { supabaseClient } from "@/lib/supabase/client";
import BottomNavigation from "@/components/bottom-navigation";
import Footer from "@/components/footer";
import Image from "next/image";
import Link from "next/link";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "치과 시술 플랫폼", // "Dental Procedure Platform"
  description: "치과 시술 견적 및 예약 플랫폼", // "Dental Procedure Quotation and Reservation Platform"
  icons: {
    icon: "https://chia-azure.vercel.app/images/chia-logo.png",
  },
  openGraph: {
    title: "치과 시술 플랫폼", // "Dental Procedure Platform"
    description: "치과 시술 견적 및 예약 플랫폼", // "Dental Procedure Quotation and Reservation Platform"
    siteName: "치과 시술 플랫폼",
    images: [
      {
        url: "https://chia-azure.vercel.app/images/chia-logo.png", // Use local SVG image
        width: 54,
        height: 24,
        alt: "Chia Logo",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default async function Page() {
  const userData = await supabaseClient.auth.getUser();
  const userId = userData?.data.user?.id;
  return (
    <MobileLayout className="!px-0 flex flex-col">
      <header className="pb-3 flex justify-between items-center px-4">
        <Image
          src={"/images/chia-logo.svg"}
          height={54}
          width={76}
          alt="logo"
        />
        {userId ? (
          <Link
            href={
              userData.data.user?.user_metadata.role === "admin"
                ? "/admin"
                : "/patient/profile"
            }
          >
            <UserIcon className="min-w-7 min-h-7" />
          </Link>
        ) : (
          <Link href="/auth/login">
            <Button className="bg-white text-black border-1 hover:bg-black/20">
              로그인 {/**Login */}
            </Button>
          </Link>
        )}
      </header>

      <MainPage />

      {userId && <BottomNavigation />}

      <Footer />
      {/* Spacer to prevent footer overlap on mobile */}
      {userId && <div className="h-14"></div>}
    </MobileLayout>
  );
}
