"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { ChevronRightIcon } from "@/app/patient/profile/icons";
import Link from "next/link";
import HeaderWithBackButton from "@/components/header-no-logo";

export default function EditProfilePage() {
  const user = useUserStore((state) => state.user);

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton title="기본 정보" /> {/* Basic Info */}
      <main className="flex-1 flex flex-col mt-2">
        <div className="flex flex-col">
          {/* Name */}
          <Link
            href="/patient/profile/edit-profile/name"
            className="flex items-center py-4"
          >
            <span className="text-sm text-gray-500 min-w-[72px]">
              이름 {/* Name */}
            </span>
            <span className="text-base text-black font-medium ml-2">
              {user?.full_name || "김00"}
            </span>
            <ChevronRightIcon className="ml-auto" />
          </Link>
          {/* Birthdate */}
          <Link
            href="/patient/profile/edit-profile/birthdate"
            className="flex items-center py-4"
          >
            <span className="text-sm text-gray-500 min-w-[72px]">
              생년월일 {/* Birthdate */}
            </span>
            <span className="text-base text-black font-medium ml-2">
              {user?.birthdate
                ? user.birthdate.replace(/-/g, ".")
                : "0000.00.00"}
            </span>
            <ChevronRightIcon className="ml-auto" />
          </Link>
          {/* Contact */}
          <Link
            href="/patient/profile/edit-profile/contact"
            className="flex items-center py-4"
          >
            <span className="text-sm text-gray-500 min-w-[72px]">
              연락처 {/* Contact */}
            </span>
            <span className="text-base text-black font-medium ml-2">
              {user?.contact_number || "010-1234-4567"}
            </span>
            <ChevronRightIcon className="ml-auto" />
          </Link>
          {/* Address */}
          <Link
            href="/patient/profile/edit-profile/address"
            className="flex items-center py-4"
          >
            <span className="text-sm text-gray-500 min-w-[72px]">
              주소 {/* Address */}
            </span>
            <span
              className={`text-base font-medium ml-2 ${
                user?.residence ? "text-black" : "text-blue-600"
              }`}
            >
              {user?.residence ? (
                user.residence
              ) : (
                <>주소지 등록 {/* Register Address */}</>
              )}
            </span>
            <ChevronRightIcon className="ml-auto" />
          </Link>
        </div>
      </main>
    </div>
  );
}
