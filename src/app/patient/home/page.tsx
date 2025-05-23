"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query"; // Import useInfiniteQuery
import Image from "next/image";
import { getPaginatedTreatments } from "@/lib/supabase/services/treatments.services";
import { getPaginatedBanners } from "@/lib/supabase/services/banners.services";
import { InfiniteList } from "@/components/supabase-infinite-list";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import ClinicCard from "./clinic-card";
import BottomNavigation from "../bottom-navigation";
import { UserIcon } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/client";

export default function MainPage() {
  const [sortOption, setSortOption] = useState("가까운순");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // const { ref: loadMoreRef, inView } = useInView(); // For detecting when to load more

  const handleSortOptionChange = (option: string) => {
    setSortOption(option);
    setIsDropdownOpen(false);
  };

  const treatmentQuery = useQuery({
    queryKey: ["treatments"],
    queryFn: async () => await getPaginatedTreatments(1, 100),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const bannerQuery = useQuery({
    queryKey: ["banners"],
    queryFn: async () => await getPaginatedBanners(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="flex flex-col min-h-screen max-w-[460px] ">
      <header className="py-4  flex justify-between items-center border-b">
        <Image
          src={"/images/chia-logo.svg"}
          height={54}
          width={76}
          alt="logo"
        />
        <Link href="/auth/login">
          <Button
            variant="ghost"
            onClick={() => supabaseClient.auth.signOut()}
            className="min-h-10 "
          >
            <UserIcon className="min-h-6 min-w-6" /> 로그아웃 {/** Logout */}
          </Button>
        </Link>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="flex flex-col h-full pb-16">
          {/* Top promotional banner */}
          <div className="bg-[#C3D1FF] h-[200px] flex flex-col justify-center font-pretendard-600 p-4 relative overflow-hidden">
            {bannerQuery.isLoading && <p>Loading banners...</p>}
            {bannerQuery.error && <p>{bannerQuery.error.message}</p>}
            {bannerQuery.data && bannerQuery.data.data[0]?.image && (
              <Image
                src={bannerQuery.data.data[0].image}
                alt="Banner"
                fill
                className="object-cover"
                priority
              />
            )}
            {/* You can overlay text or other content here if needed */}
          </div>

          {/* Category scrollable area */}
          <div
            style={{ scrollbarWidth: "none" }}
            className="flex space-x-4 px-4 py-4 border-b overflow-x-scroll"
          >
            {treatmentQuery.isLoading && <p>Loading treatments...</p>}
            {treatmentQuery.error && (
              <p>Error loading treatments: {treatmentQuery.error.message}</p>
            )}
            {treatmentQuery.data &&
              treatmentQuery.data.data.map((treatment) => (
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
                  <span className="text-xs mt-1 w-16 text-center ">
                    {treatment.treatment_name}
                  </span>
                </div>
              ))}
          </div>

          {/* Sorting options */}
          <div className="flex justify-between items-center p-4">
            <div className="text-sm">
              지금 검색할 수 있는 병원 {/** Hospitals you can search for now */}
            </div>
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
                    근무지 {/** Work Location */}
                  </div>
                  <div
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSortOptionChange("인기순")}
                  >
                    거주 {/** Residence */}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clinic listings */}
          <div className="flex-1 overflow-auto">
            <InfiniteList
              tableName="clinic"
              columns={`
                  *,
                  clinic_treatment(
                    id,
                    reservation(
                      review(
                        *
                      )
                    )
                  )
          `}
              pageSize={1}
              renderItem={(item) => (
                /* eslint-disable @typescript-eslint/no-explicit-any */
                <ClinicCard {...(item as unknown as any)} key={item.id} />
              )}
            />
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
