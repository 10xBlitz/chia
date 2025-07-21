"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import {
  fetchRoom,
  createChatRoom,
  updateRoom,
} from "@/lib/supabase/services/room.services";
import BackButton from "@/components/back-button";

import { usePatientChatUnreadRealtime } from "../hooks/use-patient-chat-unread-realtime";
import {
  fetchUnreadMessageCountOfRoom,
  fetchLatestMessageOfRoom,
} from "@/lib/supabase/services/messages.services";
import { Tables } from "@/lib/supabase/types";

interface PatientChatSidebarProps {
  setRoom: (room: Tables<"chat_room">) => void;
}

const CHAT_CATEGORIES = [
  { key: "account", label: "회원/계정" }, // Account/Member
  { key: "review", label: "후기 관리" }, // Review Management
  { key: "consult", label: "상담 신청" }, // Consultation Request
  { key: "payment", label: "앱결제" }, // App Payment
  { key: "error", label: "오류" }, // Error
  { key: "etc", label: "기타" }, // Other
];

export function PatientChatSidebar({ setRoom }: PatientChatSidebarProps) {
  const userId = useUserStore((s) => s.user?.id || "");
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  usePatientChatUnreadRealtime(userId, setUnreadCounts);

  // Handles button click: finds or creates a room for the category
  const handleCategoryClick = useCallback(
    async (category: string) => {
      if (!userId) return;
      setLoadingCategory(category);
      // Try to find existing room
      let room = null;
      try {
        room = await fetchRoom({ patient_id: userId, category });
      } catch (e) {
        // ignore fetch error, will create
        console.error("Error fetching room:", e);
      }
      if (!room) {
        try {
          room = await createChatRoom(userId, category);
        } catch (e) {
          console.error("Error creating room:", e);
          setLoadingCategory(null);
          alert(
            "채팅방 생성에 실패했습니다. 다시 시도해 주세요.\n(Failed to create chat room. Please try again.)"
          );
          return;
        }
      }
      // Update last_patient_read_at to latest message
      try {
        const latest = await fetchLatestMessageOfRoom(room.id);
        if (latest && latest.created_at) {
          await updateRoom(room.id, { last_user_read_at: latest.created_at });
        }
      } catch (e) {
        console.error("Error updating last_user_read_at:", e);
      }
      setRoom(room);
      setLoadingCategory(null);
    },
    [userId, setRoom]
  );

  // On mount, fetch unread counts for all categories/rooms
  useEffect(() => {
    async function fetchInitialUnreadCounts() {
      if (!userId) return;
      for (const cat of CHAT_CATEGORIES) {
        try {
          const room = await fetchRoom({
            patient_id: userId,
            category: cat.label,
          });
          if (room && room.id) {
            const lastRead = room.last_user_read_at || "";
            const count = await fetchUnreadMessageCountOfRoom(
              userId,
              room.id,
              lastRead
            );
            setUnreadCounts((prev) => ({ ...prev, [cat.label]: count }));
          } else {
            setUnreadCounts((prev) => ({ ...prev, [cat.label]: 0 }));
          }
        } catch {
          setUnreadCounts((prev) => ({ ...prev, [cat.label]: 0 }));
        }
      }
    }
    fetchInitialUnreadCounts();
  }, [userId]);

  useEffect(() => {}, [unreadCounts]);

  return (
    <aside className="w-full h-full  bg-white flex flex-col">
      {/* Full width sidebar */}
      {/* Header */}
      <div className="py-4 font-bold text-lg border-b flex items-center">
        {" "}
        <BackButton link="/patient/profile" /> Contact 치아
      </div>
      {/* Welcome Card */}
      <div className="flex flex-col items-center py-8 px-4">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-3">
          <span className="text-blue-600 text-2xl font-bold">Chia!</span>
        </div>
        <div className="text-center font-semibold text-lg mb-1">
          Contact 치아
        </div>
        <div className="text-center text-gray-500 text-sm mb-4">
          1:1 채팅 고객센터 {/* 1:1 Chat Customer Service */}
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm w-full">
          안녕하세요, 고객님
          <br />
          치아 1:1 채팅 고객센터입니다.
          <br />
          <br />
          궁금하신 사항을 선택해 주세요.
          <br />
          해당하는 문의가 없는 경우에는 [기타]를 선택해 주세요.
          <br />
          <br />
          운영시간 (토,일, 공휴일 제외)
          <br />
          - 월~금 : 10:00 ~ 18:00
          <br />- 점심시간 : 13:00 ~ 14:00
        </div>
      </div>
      {/* Category Buttons */}
      <div className="mt-auto p-4 grid grid-cols-3 gap-2">
        {CHAT_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`py-2 rounded border text-sm font-medium bg-white hover:bg-blue-50 transition flex items-center justify-center ${
              loadingCategory === cat.label
                ? "opacity-60 pointer-events-none"
                : ""
            }`}
            onClick={() => handleCategoryClick(cat.label)}
            disabled={loadingCategory === cat.label}
          >
            {cat.label}
            {/* Show unread badge if count > 0 */}
            {unreadCounts[cat.label] > 0 && (
              <span className="ml-2 inline-block min-w-[20px] px-2 py-0.5 rounded-full bg-red-500 text-white text-xs text-center align-middle">
                {unreadCounts[cat.label]}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
