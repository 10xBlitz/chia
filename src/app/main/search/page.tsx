"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/bottom-navigation";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full pb-16">
      <div className="p-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="치과 이름, 증상, 위치 등을 검색하세요"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute top-0 left-0 h-full flex items-center pl-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        {searchQuery ? (
          <div className="text-center">
            <p>검색 결과가 없습니다.</p>
            <p className="text-sm">다른 검색어를 입력해 보세요.</p>
          </div>
        ) : (
          <div className="text-center">
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
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <p>검색어를 입력하세요</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
