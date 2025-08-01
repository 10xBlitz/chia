"use client";

import { InfiniteList } from "@/components/supabase-infinite-list";
import { useUserStore } from "@/providers/user-store-provider";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import EventCarousel from "@/components/event";
import MainBannerCarousel from "@/components/main-banner";
import TreatmentCategoryScroll from "@/components/treatment-category";
import ClinicCard, { ClinicCardProps } from "@/components/clinic-card";
import SubBannerCarousel from "@/components/sub-banner";
import { useQuery } from "@tanstack/react-query";
import { getPaginatedClinicsWthReviews } from "@/lib/supabase/services/clinics.services";
import ClinicCardSkeleton from "@/components/loading-skeletons/clinic-card-skeleton";
import BottomNavigation from "@/components/bottom-navigation";
import Footer from "@/components/footer";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function MainPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((state) => state.user);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  let filterOption = searchParams.get("searchByAddress") || "모두"; // Default to "근무지"

  // Fetch clinics data with React Query
  const { data: clinicsData = [], isLoading } = useQuery({
    queryKey: ["clinics", filterOption],
    queryFn: async () => {
      // work address is stored as "city,region" in user.work_place
      // residence is stored as "city,region" in user.residence
      if (filterOption === "근무지") {
        filterOption = user?.work_place?.split(",")[1] || "";
      } else if (filterOption === "거주") {
        filterOption = user?.residence?.split(",")[1] || "";
      } else {
        filterOption = ""; // Reset to empty for "모두" or other cases
      }

      const result = await getPaginatedClinicsWthReviews(1, 3, {
        region: filterOption,
      });
      return result.data;
    },
    staleTime: 1000 * 60, // 1 minute cache
  });

  const handleSortOptionChange = (option: string) => {
    let regionFilter = "";
    if (option === "근무지") {
      regionFilter = user?.work_place || "";
    } else if (option === "거주") {
      regionFilter = user?.residence || "";
    }
    router.push(`?region=${regionFilter}&searchByAddress=${option}`, {
      scroll: false,
    });
  };

  let userLink = "";
  if (user?.role === "admin" && isLoggedIn) {
    userLink = "/admin";
  } else if (user?.role === "patient" && isLoggedIn) {
    userLink = "/patient/profile";
  } else if (user?.role === "dentist" && isLoggedIn) {
    userLink = "/dentist";
  } else {
    userLink = "/auth/login"; // Default to login if no role matches
  }

  useEffect(() => {
    // Check if user is logged in
    if (
      user?.id &&
      user.role &&
      user.login_status === "active" &&
      user.work_place
    ) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [user?.id, user?.role, user?.work_place, user?.login_status]);

  return (
    <>
      <header className="pb-3 flex justify-between items-center px-5">
        <Image
          src={"/images/chia-logo.png"}
          height={84}
          width={106}
          alt="logo"
        />
        {isLoggedIn ? (
          <Link href={userLink}>
            <UserIcon className="min-w-7 min-h-7" />
          </Link>
        ) : (
          <Link href={userLink}>
            <Button className="bg-white text-black border-1 hover:bg-black/20">
              로그인 {/**Login */}
            </Button>
          </Link>
        )}
      </header>
      <main className="flex-1 overflow-hidden flex flex-col h-full pb-16">
        <MainBannerCarousel />
        <TreatmentCategoryScroll />
        {/* Sorting options */}
        <div className="flex justify-end items-center px-6 py-2">
          {isLoggedIn && (
            <Select value={filterOption} onValueChange={handleSortOptionChange}>
              <SelectTrigger className="w-[100px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="모두">
                  모두
                </SelectItem>{" "}
                {/** All */}
                <SelectItem className="cursor-pointer" value="근무지">
                  근무지
                </SelectItem>
                {/** Workplace */}
                <SelectItem className="cursor-pointer" value="거주">
                  거주
                </SelectItem>{" "}
                {/** Residence */}
              </SelectContent>
            </Select>
          )}
        </div>
        {/* Custom clinic/event/sub-banner order */}
        <div className="flex flex-col gap-4 flex-1 px-2">
          {/* 1. First 2 clinics */}

          {isLoading &&
            Array.from({ length: 2 }).map((_, index) => (
              <ClinicCardSkeleton key={index} />
            ))}
          {clinicsData &&
            clinicsData
              .slice(0, 2)
              .map((item) => (
                <ClinicCard {...item} key={item.id} showBookmark={true} />
              ))}
          {/* No clinics found message when user filters */}
          {clinicsData && clinicsData.length === 0 && filterOption && (
            <p className="text-center text-gray-500 px-4 py-15">
              해당 지역에는 조건에 맞는 병원이 없습니다. 다른 지역을 선택하거나
              필터를 조정해보세요.
              {/** There are no hospitals in your area that match your criteria. Please select a different area or adjust your filters. */}
            </p>
          )}
          {/* 2. SubBanner */}
          <SubBannerCarousel />
          {/* 3. Next 1 clinic */}
          {clinicsData &&
            clinicsData
              .slice(2, 3)
              .map((item) => <ClinicCard {...item} key={item.id} />)}
          {/* 4. Event Carousel */}
          <EventCarousel />
          {/* 5. Rest of clinics with infinite scroll */}
          {clinicsData && clinicsData.length >= 3 && (
            <InfiniteList
              key={filterOption} // Reset list when sort changes
              tableName="clinic"
              className=""
              columns={`
                      *,
                      clinic_treatment(
                        id,
                        reservation(*),
                        review(*)
                      )
                    `}
              pageSize={100}
              // Only skip first 3 clinics, fetch all remaining
              trailingQuery={(query) => {
                let addressFilter = "";
                if (filterOption === "근무지") {
                  //workplace
                  addressFilter = user?.work_place.split(",")[1] || "";
                } else if (filterOption === "거주") {
                  //residence
                  addressFilter = user?.residence.split(",")[1] || "";
                }
                let q = query;
                if (addressFilter) {
                  q = q.eq("region", addressFilter);
                }
                q = q.filter("status", "eq", "active");
                q = q.range(3, 1000);
                q = q.order("is_pinned", { ascending: false }); // Pinned clinics first
                q.order("id", { ascending: true });
                return q;
              }}
              renderItem={(item, index) => {
                return (
                  index >= 3 && (
                    <ClinicCard {...(item as ClinicCardProps)} key={item.id} />
                  )
                );
              }}
            />
          )}
        </div>
      </main>
      {isLoggedIn && <BottomNavigation />}
      <Footer />
      {/* Spacer to prevent footer overlap on mobile */}
      {isLoggedIn && <div className="h-14"></div>}
    </>
  );
}
