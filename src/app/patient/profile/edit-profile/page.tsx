"use client";

import { useUserStore } from "@/providers/user-store-provider";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EditIcon, LockIcon } from "lucide-react";
import { EditProfileModal } from "./edit-profile-modal";
import { format } from "date-fns";
import { EditPasswordModal } from "@/components/modals/edit-password-modal";

// Reusable InfoRow component
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

type modalState = "profile" | "password" | "none";
export default function EditProfilePage() {
  const user = useUserStore((state) => state.user);

  const [modal, setModal] = useState<modalState>("none");

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton title="기본 정보" /> {/* Basic Info */}
      <main className="flex-1 flex flex-col mt-2">
        <div className="flex flex-col">
          <InfoRow
            label="이름" // Name
            value={user?.full_name}
            emptyText="이름 등록" // Register Name
          />
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

          {/* Edit Basic Info Button */}
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
              <LockIcon className="w-4 h-4" /> 비밀번호 변경
              {/* Change Password */}
            </Button>
          </div>
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
