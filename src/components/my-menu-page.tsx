"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { UserIcon, ChevronRightIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

interface ProfilePageProps {
  actions: {
    href: string;
    icon: React.ComponentType;
    label: string;
  }[];
  editProfileLink: string;
}

export default function MyMenuPage({
  actions,
  editProfileLink,
}: ProfilePageProps) {
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
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-4 bg-[#E5E5EC] py-1 text-sm font-medium"
            onClick={() => router.push(editProfileLink)}
          >
            수정 {/* Edit */}
          </Button>
        </section>

        {/* Quick actions */}
        <section className="flex gap-3 px-5 mt-6">
          {actions.map((action) => (
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
            <Button
              variant={"ghost"}
              onClick={async () => {
                await supabaseClient.auth.signOut();
                router.push("/");
              }}
              className="flex items-center w-full justify-between "
            >
              <span className="ml-2">로그아웃 {/* Logout */}</span>
              <ChevronRightIcon className="min-h-5 min-w-5 mr-2" />
            </Button>

            <Button
              variant={"ghost"}
              onClick={async () => {
                router.push("/auth/withdraw");
              }}
              className="flex items-center w-full justify-between "
            >
              <span className="ml-2">회원탈퇴 {/* Withdraw Membership */}</span>
              <ChevronRightIcon className="min-h-5 min-w-5 mr-2 " />
            </Button>
          </div>
        </section>

        {/* Customer center */}
        <section className="mt-8">
          <div className="px-5 mb-2 font-semibold text-sm">
            고객센터 {/* Customer Center */}
          </div>
          <div className="bg-white">
            <Button
              variant={"ghost"}
              onClick={async () => {
                router.push("/patient/profile/chat");
              }}
              className="flex items-center w-full justify-between "
            >
              <span className="ml-2">
                {" "}
                서비스 이용 문의 {/* Service Inquiry */}
              </span>
              <ChevronRightIcon className="min-h-5 min-w-5 mr-2" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
