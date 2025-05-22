"use client";

import { useState } from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClinicCard from "@/components/clinic-card";
import BottomNavigation from "@/components/bottom-navigation";

// Mock data for clinic listings
const clinics = [
  {
    id: 1,
    name: "임산치과의원",
    rating: 4.4,
    reviewCount: 130,
    image: "/images/chia-logo.svg",
  },
  {
    id: 2,
    name: "임산치과의원",
    rating: 4.4,
    reviewCount: 130,
    image: "/images/chia-logo.svg",
  },
  {
    id: 3,
    name: "임산치과의원",
    rating: 4.4,
    reviewCount: 130,
    image: "/images/chia-logo.svg",
  },
  {
    id: 4,
    name: "임산치과의원",
    rating: 4.4,
    reviewCount: 130,
    image: "/images/chia-logo.svg",
  },
  {
    id: 5,
    name: "임산치과의원",
    rating: 4.4,
    reviewCount: 130,
    image: "/images/chia-logo.svg",
  },
];

// Mock categories
const categories = ["임플란트", "임플란트", "임플란트", "임플란트", "임플란트"];

export default function MainPage() {
  const [sortOption, setSortOption] = useState("가까운순");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSortOptionChange = (option: string) => {
    setSortOption(option);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex flex-col h-full pb-16">
      {/* Top promotional banner */}
      <div className="bg-blue-100 p-4 relative">
        <div>
          <div className="text-sm">Brand Name</div>
          <div className="text-xl font-bold">메인 타이틀</div>
          <div className="text-lg">2줄 이상</div>
          <div className="text-xs mt-2">본문 텍스트 마지막 라인</div>
        </div>
        <div className="absolute top-2 right-2 bg-black text-white text-xs rounded-full px-2 py-1">
          12/99
        </div>
      </div>

      {/* Category scrollable area */}
      <ScrollArea className="whitespace-nowrap py-4 border-b">
        <div className="flex space-x-4 px-4">
          {categories.map((category, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <span className="text-xs mt-1">{category}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Sorting options */}
      <div className="flex justify-between items-center p-4">
        <div className="text-sm">지금 검색할 수 있는 병원</div>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-sm flex items-center"
          >
            {sortOption}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg z-10">
              <div
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSortOptionChange("가까운순")}
              >
                가까운순
              </div>
              <div
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSortOptionChange("인기순")}
              >
                인기순
              </div>
              <div
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSortOptionChange("관련순")}
              >
                관련순
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clinic listings */}
      <div className="flex-1 overflow-auto">
        {clinics.map((clinic) => (
          <ClinicCard
            key={clinic.id}
            id={clinic.id}
            name={clinic.name}
            rating={clinic.rating}
            reviewCount={clinic.reviewCount}
            image={clinic.image}
          />
        ))}
      </div>

      {/* Bottom navigation */}
      <BottomNavigation />
    </div>
  );
}
