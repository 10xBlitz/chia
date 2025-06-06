"use client";

import { useUserStore } from "@/providers/user-store-provider";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EditIcon } from "lucide-react";
import { EditProfileModal } from "./edit-profile-modal";
import { format } from "date-fns";

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

export default function EditProfilePage() {
  const user = useUserStore((state) => state.user);

  const [openProfile, setOpenProfile] = useState(false);

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton title="기본 정보" /> {/* Basic Info */}
      <main className="flex-1 flex flex-col mt-2">
        <div className="flex flex-col">
          <InfoRow
            label="이름" // Name
            value={user?.full_name || "김00"}
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
            value={user?.contact_number || "010-1234-4567"}
          />
          <InfoRow
            label="주소" // Address
            value={user?.residence}
            highlightWhenEmpty
            emptyText="주소지 등록" // Register Address
          />
          {/* Edit Basic Info Button */}
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-md px-4 py-1 text-sm font-medium flex items-center gap-1"
              onClick={() => setOpenProfile(true)}
            >
              <EditIcon className="w-4 h-4" /> 정보 수정 {/* Edit Info */}
            </Button>
          </div>
        </div>
      </main>
      {/* Modals */}
      <EditProfileModal
        open={openProfile}
        onClose={() => setOpenProfile(false)}
        userData={{ user }}
      />
    </div>
  );
}
