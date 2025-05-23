"use client";

import { useEffect, useState } from "react";
import ClinicCard from "@/components/clinic-card";
import { Tables } from "@/lib/supabase/types";
import { supabaseClient } from "@/lib/supabase/client";
import { useInfiniteQuery } from "@tanstack/react-query"; // Import useInfiniteQuery
import { useInView } from "react-intersection-observer"; // Import useInView
import Image from "next/image";

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
const TREATMENTS_PER_PAGE = 10; // Number of treatments to fetch per page
const fetchTreatments = async ({ pageParam = 0 }: { pageParam?: number }) => {
  const from = pageParam * TREATMENTS_PER_PAGE;
  const to = from + TREATMENTS_PER_PAGE - 1;

  const { data, error, count } = await supabaseClient
    .from("treatment")
    .select("id, treatment_name, image_url", { count: "exact" }) // Fetch count for hasNextPage logic
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }
  return {
    data: data || [],
    nextPage:
      (pageParam + 1) * TREATMENTS_PER_PAGE < (count || 0)
        ? pageParam + 1
        : undefined,
    count,
  };
};

export default function MainPage() {
  const [sortOption, setSortOption] = useState("가까운순");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { ref: loadMoreRef, inView } = useInView(); // For detecting when to load more

  const handleSortOptionChange = (option: string) => {
    setSortOption(option);
    setIsDropdownOpen(false);
  };

  const {
    data: treatmentsData,
    fetchNextPage,
    hasNextPage,
    isLoading: isLoadingTreatments,
    isFetchingNextPage,
    error: treatmentsError,
  } = useInfiniteQuery<Awaited<ReturnType<typeof fetchTreatments>>, Error>({
    queryKey: ["treatments"],
    queryFn: async () => await fetchTreatments({ pageParam: 0 }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0, // Ensure initialPageParam is set
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  const allTreatments =
    treatmentsData?.pages.flatMap((page) => page.data) || [];
  return (
    <div className="flex flex-col h-full pb-16">
      {/* Top promotional banner */}
      <div className="bg-[#C3D1FF] h-[200px] flex flex-col justify-center font-pretendard-600 p-4 relative">
        <div>
          <div className="text-[14px]">Brand Name</div>
          <div className=" text-[24px]">메인 타이틀</div>
          <div className="text-[24px]">2줄 이상</div>
          <div className="text-[14px] mt-2">본문 텍스트 마지막 라인</div>
        </div>
        <div className="absolute top-2 right-2 bg-black text-white text-xs rounded-full px-2 py-1">
          12/99
        </div>
      </div>

      {/* Category scrollable area */}
      <div
        style={{ scrollbarWidth: "none" }}
        className="flex space-x-4 px-4 py-4 border-b overflow-x-scroll"
      >
        {isLoadingTreatments && !allTreatments.length && (
          <p>Loading treatments...</p>
        )}
        {treatmentsError && (
          <p>Error loading treatments: {treatmentsError.message}</p>
        )}
        {allTreatments.map((treatment, index) => (
          <div
            key={treatment.id}
            className="flex flex-col items-center flex-shrink-0" // Added flex-shrink-0
            // Add ref to the last item for infinite scroll trigger, or a dedicated sentinel element
            // ref={index === allTreatments.length - 1 ? loadMoreRef : null}
          >
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {treatment.image_url ? (
                <Image
                  src={treatment.image_url}
                  alt={treatment.treatment_name || "treatment"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <span className="text-xs text-gray-500">Icon</span>
              )}
            </div>
            <span className="text-xs mt-1 w-16 text-center truncate">
              {treatment.treatment_name}
            </span>
          </div>
        ))}
        {/* Sentinel element for triggering load more */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="flex-shrink-0">
            {isFetchingNextPage ? "Loading more..." : ""}
          </div>
        )}
      </div>

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
    </div>
  );
}
