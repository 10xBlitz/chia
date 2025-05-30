"use client";

import { useUserStore } from "@/providers/user-store-provider";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EditIcon } from "lucide-react";
import { EditProfileModal } from "./edit-profile-modal";
import { format } from "date-fns";

export default function EditProfilePage() {
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const [openProfile, setOpenProfile] = useState(false);

  return (
    <div className="flex flex-col">
      <HeaderWithBackButton title="기본 정보" /> {/* Basic Info */}
      <main className="flex-1 flex flex-col mt-2">
        <div className="flex flex-col">
          {/* Name, Birthdate, Contact, Address */}
          <div className="flex items-center py-4">
            <span className="text-sm text-gray-500 min-w-[72px]">
              이름 {/* Name */}
            </span>
            <span className="text-base text-black font-medium ml-2">
              {user?.full_name || "김00"}
            </span>
          </div>
          <div className="flex items-center py-4">
            <span className="text-sm text-gray-500 min-w-[72px]">
              생년월일 {/* Birthdate */}
            </span>
            <span className="text-base text-black font-medium ml-2">
              {user?.birthdate
                ? format(user.birthdate, "yyyy.MM.dd")
                : "0000.00.00"}
            </span>
          </div>
          <div className="flex items-center py-4">
            <span className="text-sm text-gray-500 min-w-[72px]">
              연락처 {/* Contact */}
            </span>
            <span className="text-base text-black font-medium ml-2">
              {user?.contact_number || "010-1234-4567"}
            </span>
          </div>
          <div className="flex items-center py-4">
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
          </div>
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
          {/* Edit Password Button */}
        </div>
      </main>
      {/* Modals */}
      <EditProfileModal
        open={openProfile}
        onClose={() => setOpenProfile(false)}
        userData={{ user }}
        onUserUpdated={updateUser}
      />
    </div>
  );
}
