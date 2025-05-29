"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BottomNavigation from "../bottom-navigation";
import {
  ReservationsIcon,
  FavoriteIcon,
  ReviewIcon,
  UserIcon,
  ChevronRightIcon,
} from "@/app/patient/profile/icons";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

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

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="py-4 px-5 font-bold font-pretendard-600 text-lg">
        마이 {/* My */}
      </header>
      <main className="flex-1 flex flex-col pb-20">
        {/* Profile section */}
        <section className="px-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <UserIcon />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-base">
              {user?.full_name || "김00" /* Kim 00 */}
            </div>
            <div className="text-xs text-gray-500">
              {
                user?.birthdate
                  ? `${user.birthdate.slice(0, 4)}년 ${user.birthdate.slice(
                      5,
                      7
                    )}월 ${user.birthdate.slice(8, 10)}일`
                  : "0000년 0월 00일" /* 0000 year 0 month 00 day */
              }
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-4 bg-[#E5E5EC] py-1 text-sm font-medium"
            onClick={() => router.push("/patient/profile/edit-profile")}
          >
            수정 {/* Edit */}
          </Button>
        </section>

        {/* Quick actions */}
        <section className="flex gap-3 px-5 mt-6">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex-1 flex flex-col gap-2 items-center justify-center bg-gray-50 rounded-xl py-5"
            >
              <action.icon />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </section>

        {/* Account management */}
        <section className="mt-8">
          <div className="px-5 mb-2 font-semibold text-sm">
            계정 관리 {/* Account Management */}
          </div>
          <div className="bg-white">
            <Link
              href="#"
              onClick={async () => {
                await supabaseClient.auth.signOut();
                router.push("/");
              }}
              className="flex items-center justify-between px-5 py-3 text-sm "
            >
              로그아웃 {/* Logout */}
              <ChevronRightIcon />
            </Link>
            <Link
              href="/auth/withdraw"
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              회원탈퇴 {/* Withdraw Membership */}
              <ChevronRightIcon />
            </Link>
          </div>
        </section>

        {/* Customer center */}
        <section className="mt-8">
          <div className="px-5 mb-2 font-semibold text-sm">
            고객센터 {/* Customer Center */}
          </div>
          <div className="bg-white">
            <Link
              href="/support"
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              서비스 이용 문의 {/* Service Inquiry */}
              <ChevronRightIcon />
            </Link>
          </div>
        </section>
      </main>
      <BottomNavigation />
    </div>
  );
}
