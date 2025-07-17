"use client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../sidebar";
import { usePathname } from "next/navigation";
import React from "react";
import { useRoomSelectionStore } from "./room-selection-context";

export default function CustomerServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Map route to page title (Korean with English comments)
  const pageTitles: Record<string, string> = {
    "/admin/main/user": "유저 관리", // User Management
    "/admin/main/clinic": "병원 관리", // Clinic Management
    "/admin/main/clinic-event": "병원 이벤트", // Clinic Event
    "/admin/main/treatment": "진료 항목", // Treatments
    "/admin/main/reservation": "예약 관리", // Reservation Management
    "/admin/main/review": "리뷰 관리", // Review Management
    "/admin/customer-service": "고객센터", // Customer Service
    "/admin/main/settings": "설정", // Settings
  };
  const currentTitle = pageTitles[pathname] || "관리자"; // Admin (default)

  // Helper: detect mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const setCurrentRoom = useRoomSelectionStore((s) => s.setCurrentRoom);
  const currentRoomId = useRoomSelectionStore((s) => s.currentRoomId);
  const currentRoomUserName = useRoomSelectionStore(
    (s) => s.currentRoomUserName
  );
  const currentRoomCategory = useRoomSelectionStore(
    (s) => s.currentRoomCategory
  );

  return (
    <SidebarProvider>
      <div className="flex w-[100dvw]">
        {/* Appbar for mobile with sidebar trigger and page title */}
        <div className="md:hidden fixed top-0 left-0 w-full z-50 h-14 flex items-center bg-white/95 backdrop-blur shadow border-b border-gray-200 px-2">
          {!currentRoomId && <SidebarTrigger className="ml-2 " />}
          {isMobile && currentRoomId && (
            <button
              className="ml-2 p-2 rounded hover:bg-gray-100"
              onClick={() => setCurrentRoom(null, null, null)}
              aria-label="뒤로가기"
            >
              ←
            </button>
          )}
          <span className="ml-4 text-base font-semibold truncate">
            {isMobile && currentRoomId
              ? `${currentRoomCategory ? `[${currentRoomCategory}] ` : ""}${
                  currentRoomUserName || ""
                }`
              : currentTitle}
          </span>
        </div>
        <AppSidebar />
        <main className="flex-1 mt-8 md:mt-0 bg-[#F1F1F5] overflow-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
