"use client";

import HeaderWithBackButton from "@/components/header-with-back-button";
import { format } from "date-fns";
import { useUserStore } from "@/providers/user-store-provider";
import { Button } from "@/components/ui/button";
import { EditIcon, LockIcon } from "lucide-react";
import { useState } from "react";
import { EditProfileModal } from "@/app/patient/profile/edit-profile/edit-profile-modal";
import { EditPasswordModal } from "@/components/modals/edit-password-modal";

// Reusable InfoRow component (copied from patient profile)
function InfoRow({
  label,
  value,
  highlightWhenEmpty = false,
  emptyText,
  onClick,
}: {
  label: string;
  value?: string;
  highlightWhenEmpty?: boolean;
  emptyText?: string;
  onClick?: () => void;
}) {
  const displayValue =
    value && value.trim().length > 0 ? value : emptyText ? emptyText : "-";
  const textColor =
    value && value.trim().length > 0
      ? "text-black"
      : highlightWhenEmpty
      ? "text-blue-600"
      : "text-gray-400";
  return (
    <div
      className={`flex items-center py-4 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <span className="text-sm text-gray-500 min-w-[72px]">{label}</span>
      <span className={`text-base font-medium ml-2 ${textColor}`}>
        {displayValue}
      </span>
    </div>
  );
}

type ModalState = "profile" | "password" | "none";

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  const [modal, setModal] = useState<ModalState>("none");

  // Dentist-specific fields
  const dentistName = user?.clinic?.clinic_name || "일신치과의원"; // Default: Ilsin Dental Clinic
  const establishedAt = user?.clinic?.created_at
    ? format(new Date(user.clinic.created_at), "yyyy.MM.dd")
    : "0000.00.00";
  const clinicContact = user?.clinic?.contact_number || "02-123-1234";
  const clinicAddress = user?.clinic?.location;
  const clinicRegion = user?.clinic?.region;

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton title="프로필" /> {/* Profile */}
      <main className="flex-1 flex flex-col mt-2">
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-black mt-6 mb-2">
            기본 정보 {/* Basic Info */}
          </div>
          <InfoRow label="이름" value={user?.full_name} emptyText="이름 등록" />{" "}
          <InfoRow
            label="이메일" // Email
            value={user?.email}
            emptyText="이메일 등록" // Register Email
          />
          <InfoRow
            label="생년월일" // Birthdate
            value={
              user?.birthdate
                ? format(user.birthdate, "yyyy.MM.dd")
                : "0000.00.00"
            }
          />
          <InfoRow
            label="성별" //  Gender
            value={user?.gender}
          />
          <InfoRow
            label="연락처" // Contact
            value={user?.contact_number}
            emptyText="연락처 등록" // Register Contact
          />
          <InfoRow
            label="거주지 주소" // Residence Address
            value={user?.residence}
            highlightWhenEmpty
            emptyText="거주지 주소 등록" // Register Residence Address
          />
          <InfoRow
            label="근무지 주소" // Work Address
            value={user?.work_place}
            highlightWhenEmpty
            emptyText="근무지 주소 등록" // Register Work Address
          />
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
          <div className="text-sm font-semibold text-black mt-6 mb-2">
            병원 정보 {/* Clinic Info */}
          </div>
          <InfoRow label="병원명" value={dentistName} emptyText="병원명 등록" />{" "}
          {/* Clinic Name / Register Clinic Name */}
          <InfoRow
            label="개설일" // Established At
            value={establishedAt}
            emptyText="개설일 등록" // Register Established At
          />
          <InfoRow
            label="연락처" // Contact
            value={clinicContact}
            emptyText="연락처 등록" // Register Contact
          />
          <InfoRow
            label="소재지" // Location
            value={clinicAddress}
            emptyText="소재지 등록" // Register Location
          />
          <InfoRow
            label="소재지 지역" // Location Region
            value={clinicRegion}
            emptyText="소재지 등록" // Register Location
          />
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
