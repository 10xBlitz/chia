"use client";

import HeaderWithBackButton from "@/components/header-with-back-button";
import { format } from "date-fns";
import Link from "next/link";
import { useUserStore } from "@/providers/user-store-provider";
import { Button } from "@/components/ui/button";
import { EditIcon, LockIcon } from "lucide-react";
import { useState } from "react";
import { EditProfileModal } from "@/app/patient/profile/edit-profile/edit-profile-modal";
import { EditPasswordModal } from "@/components/modals/edit-password-modal";

type ModalState = "profile" | "password" | "none";

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  const [modal, setModal] = useState<ModalState>("none");

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

        {/* Edit Buttons */}
        <div className="flex justify-end mb-2 gap-4 flex-col mt-10">
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-4 py-1 text-sm font-medium flex items-center gap-1"
            onClick={() => setModal("profile")}
          >
            <EditIcon className="w-4 h-4" /> 정보 수정 {/* Edit Info */}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-4 py-1 text-sm font-medium flex items-center gap-1"
            onClick={() => setModal("password")}
          >
            <LockIcon className="w-4 h-4" /> 비밀번호 변경{" "}
            {/* Change Password */}
          </Button>
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
      {/* Modals */}
      <EditProfileModal
        open={modal === "profile"}
        onClose={() => setModal("none")}
        userData={user}
      />
      <EditPasswordModal
        open={modal === "password"}
        onClose={() => setModal("none")}
        userData={user}
      />
    </div>
  );
}
