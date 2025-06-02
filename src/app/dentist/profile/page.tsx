"use client";

import HeaderWithBackButton from "@/components/header-with-back-button";
import { format } from "date-fns";
import Link from "next/link";
import { useUserStore } from "@/providers/user-store-provider";

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  // Dentist-specific fields
  const dentistName = user?.clinic?.clinic_name || "일신치과의원";
  const establishedAt = user?.clinic?.created_at
    ? format(new Date(user.clinic.created_at), "yyyy.MM.dd")
    : "0000.00.00";
  const clinicContact = user?.clinic?.contact_number || "02-123-1234";
  const clinicAddress = user?.clinic?.location;

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton title="프로필" />
      <main className="flex-1 flex flex-col mt-2">
        {/* Basic Info */}
        <div className="text-sm font-semibold text-black mt-6 mb-2">
          기본 정보 {/* Basic Info */}
        </div>
        <div className="flex items-center py-4">
          <span className="text-sm text-gray-500 min-w-[72px]">이름</span>{" "}
          {/* Name */}
          <span className="text-base font-medium ml-2 text-black">
            {user?.full_name || "김00"}
          </span>
        </div>
        <div className="flex items-center py-4">
          <span className="text-sm text-gray-500 min-w-[72px]">생년월일</span>{" "}
          {/* Birthdate */}
          <span className="text-base font-medium ml-2 text-black">
            {user?.birthdate
              ? format(new Date(user.birthdate), "yyyy.MM.dd")
              : "1996.03.18"}
          </span>
        </div>
        <div className="flex items-center py-4">
          <span className="text-sm text-gray-500 min-w-[72px]">연락처</span>{" "}
          {/* Contact */}
          <span className="text-base font-medium ml-2 text-black">
            {user?.contact_number || "010-1234-4567"}
          </span>
        </div>
        <div className="flex items-center py-4">
          <span className="text-sm text-gray-500 min-w-[72px]">주소</span>{" "}
          {/* Address */}
          {user?.residence ? (
            <span className="text-base font-medium ml-2 text-black">
              {user.residence}
            </span>
          ) : (
            <Link href="#" className="text-base font-medium ml-2 text-blue-600">
              주소지 등록 {/* Register Address */}
            </Link>
          )}
        </div>

        {/* Divider */}
        <div className="border-t my-4" />

        {/* Clinic Info */}
        <div className="text-sm font-semibold text-black mt-6 mb-2">
          병원 정보 {/* Clinic Info */}
        </div>
        <div className="flex items-center py-4">
          <span className="text-sm text-gray-500 min-w-[72px]">병원명</span>{" "}
          {/* Clinic Name */}
          <span className="text-base font-medium ml-2 text-black">
            {dentistName}
          </span>
        </div>
        <div className="flex items-center py-4">
          <span className="text-sm text-gray-500 min-w-[72px]">개설일</span>{" "}
          {/* Established At */}
          <span className="text-base font-medium ml-2 text-black">
            {establishedAt}
          </span>
        </div>
        <div className="flex items-center py-4">
          <span className="text-sm text-gray-500 min-w-[72px]">연락처</span>{" "}
          {/* Contact */}
          <span className="text-base font-medium ml-2 text-black">
            {clinicContact}
          </span>
        </div>
        <div className="flex items-center py-4">
          <span className="text-sm text-gray-500 min-w-[72px]">소재지</span>{" "}
          {/* Location */}
          {clinicAddress ? (
            <span className="text-base font-medium ml-2 text-black">
              {clinicAddress}
            </span>
          ) : (
            <Link href="#" className="text-base font-medium ml-2 text-blue-600">
              소재지 등록 {/* Register Location */}
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
