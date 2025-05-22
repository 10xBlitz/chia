"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/bottom-navigation";

export default function ReservationsPage() {
  return (
    <div className="flex flex-col h-full pb-16">
      <div className="p-4">
        <h1 className="text-xl font-bold">나의 예약</h1>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="upcoming">예정된 예약</TabsTrigger>
          <TabsTrigger value="past">지난 예약</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="flex-1">
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 text-gray-300"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <p>예정된 예약이 없습니다</p>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md">
              예약하기
            </button>
          </div>
        </TabsContent>

        <TabsContent value="past" className="flex-1">
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 text-gray-300"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <p>지난 예약 내역이 없습니다</p>
          </div>
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
}
