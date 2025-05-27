"use client";

import { useEffect } from "react";
import Image from "next/image";
import { InfiniteList } from "@/components/supabase-infinite-list";
import { useUserStore } from "@/providers/user-store-provider";
import ClinicCard from "./clinic-card";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import MainBannerCarousel from "./main-banner";
import SubBannerCarousel from "./sub-banner";
import TreatmentCategoryScroll from "./treatment-category";
import EventCarousel from "./event";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getPaginatedClinicsWthReviews } from "@/lib/supabase/services/clinics.services";
import BottomNavigation from "../bottom-navigation";
import { UserIcon } from "lucide-react";

export default function MainPage() {
  const searchParams = useSearchParams();
  const filterOption = searchParams.get("searchByAddress") || ""; // Default to "근무지"
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  const handleSortOptionChange = (option: string) => {
    router.push(`?searchByAddress=${option}`, { scroll: false });
    // You can also trigger a refetch of the clinic list here if needed
  };

  useEffect(() => {
    if (user?.role === "patient") {
      router.push("/patient/home");
    }
  }, []);

  // Fetch first 3 clinics for custom placement
  const {
    data: clinicsData,
    isFetching: clinicsLoading,
    error: clinicsError,
  } = useQuery({
    queryKey: ["clinics-initial", filterOption],
    queryFn: async () => {
      let addressFilter = "";
      if (filterOption === "근무지") {
        //workplace
        addressFilter = user?.work_place.split(",")[1] || "";
      } else if (filterOption === "거주") {
        //residence
        addressFilter = user?.residence.split(",")[1] || "";
      }
      const res = await getPaginatedClinicsWthReviews(1, 3, {
        region: addressFilter,
      });
      return res.data || [];
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  return (
    <div className="flex flex-col max-w-[460px] mx-auto">
      <header className="py-3 px-5 flex justify-between items-center">
        <Image
          src={"/images/chia-logo.svg"}
          height={54}
          width={76}
          alt="logo"
        />
        <Link href="/auth/login">
          <UserIcon className="min-w-7 min-h-7" />
        </Link>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col h-full pb-16">
        {/* Top promotional banner */}
        <MainBannerCarousel />

        {/* Category scrollable area */}
        <TreatmentCategoryScroll />

        {/* Sorting options */}
        <div className="flex justify-between items-center p-4">
          <div className="text-sm">
            지금 걸어갈 수 있는 병원 {/** Hospitals you can walk to now */}
          </div>
          <Select value={filterOption} onValueChange={handleSortOptionChange}>
            <SelectTrigger className="w-[100px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="근무지">근무지</SelectItem> {/** Workplace */}
              <SelectItem value="거주">거주</SelectItem> {/** Residence */}
            </SelectContent>
          </Select>
        </div>

        {/* Custom clinic/event/sub-banner order */}
        <div className="flex flex-col gap-4 flex-1 overflow-auto px-2">
          {/* 1. First 2 clinics */}
          {clinicsLoading && <p>Loading clinics...</p>}
          {clinicsError && <p>Error loading clinics: {clinicsError.message}</p>}
          {clinicsData &&
            clinicsData
              .slice(0, 2)
              .map((item) => <ClinicCard {...item} key={item.id} />)}

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
          {clinicsData && clinicsData?.length >= 3 && (
            <InfiniteList
              key={filterOption} // Reset list when sort changes
              tableName="clinic"
              columns={`
                      *,
                      clinic_treatment(
                        id,
                        reservation(*),
                        review(*)
                      )
                    `}
              pageSize={5}
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

                q = q.range(3, 1000);
                q.order("id", { ascending: true });

                return q;
              }}
              renderItem={(item, index) => {
                /* eslint-disable @typescript-eslint/no-explicit-any */
                return (
                  index > 3 && (
                    <ClinicCard {...(item as unknown as any)} key={item.id} />
                  )
                );
              }}
            />
          )}
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
