"use client";

import { useEffect } from "react";
import Image from "next/image";
import { InfiniteList } from "@/components/supabase-infinite-list";
import { useUserStore } from "@/providers/user-store-provider";
import ClinicCard from "./clinic-card";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import MainBannerCarousel from "./main-banner-carousel";
import SubBannerCarousel from "./sub-banner-carousel";
import TreatmentCategoryScroll from "./treatment-category-scroll";
import EventCarousel from "./event-scroll";

import { useQuery } from "@tanstack/react-query";
import { getPaginatedClinicsWthReviews } from "@/lib/supabase/services/clinics.services";

export default function MainPage() {
  const searchParams = useSearchParams();
  const filterOption = searchParams.get("searchByAddress") || ""; // Default to "근무지"
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "patient") {
      router.push("/patient/home");
    }
    if (user?.role === "dentist") {
      router.push("/dentist");
    }
    if (user?.role === "admin") {
      router.push("/admin");
    }
  }, []);

  // Fetch first 3 clinics for custom placement
  const {
    data: clinicsData,
    isLoading: clinicsLoading,
    error: clinicsError,
  } = useQuery({
    queryKey: ["clinics-initial", filterOption],
    queryFn: async () => {
      const res = await getPaginatedClinicsWthReviews(1, 3, {
        region: filterOption,
      });
      return res.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="flex flex-col min-h-screen max-w-[460px] mx-auto">
      <header className="py-4 px-4 flex justify-between items-center border-b">
        <Image
          src={"/images/chia-logo.svg"}
          height={54}
          width={76}
          alt="logo"
        />
        <Link href="/auth/login">
          <Button variant="outline" className="min-h-10 ">
            로그인 {/** Login */}
          </Button>
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
        </div>

        {/* Custom clinic/event/sub-banner order */}
        <div className="flex flex-col gap-4 flex-1 overflow-auto">
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
              let q = query.range(3, 1000); // 1000 is an arbitrary large number to get all after 3
              if (filterOption) {
                q = q.eq("region", filterOption);
              }
              return q;
            }}
            renderItem={(item) => (
              /* eslint-disable @typescript-eslint/no-explicit-any */
              <ClinicCard {...(item as unknown as any)} key={item.id} />
            )}
          />
        </div>
      </main>
    </div>
  );
}
