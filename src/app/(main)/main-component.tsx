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

// import ClinicCardSkeleton from "@/components/loading-skeletons/clinic-card-skeleton";
// import { getPaginatedClinicsWthReviews } from "@/lib/supabase/services/clinics.services";

interface MainPageProps {
  clinicsData: ClinicCardProps[];
}

export default function MainPage({ clinicsData }: MainPageProps) {
  const searchParams = useSearchParams();
  const filterOption = searchParams.get("searchByAddress") || ""; // Default to "근무지"
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  const handleSortOptionChange = (option: string) => {
    router.push(`?searchByAddress=${option}`, { scroll: false });
  };

  return (
    <>
      <main className="flex-1 overflow-hidden flex flex-col h-full pb-16">
        <MainBannerCarousel />
        <TreatmentCategoryScroll />
        {/* Sorting options */}
        <div className="flex justify-between items-center p-4">
          <div className="text-sm">
            지금 걸어갈 수 있는 병원 {/** Hospitals you can walk to now */}
          </div>
          {user?.id && (
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
          {clinicsData &&
            clinicsData
              .slice(0, 2)
              .map((item) => <ClinicCard {...item} key={item.id} />)}
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
              className="px-4"
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
                  addressFilter = user?.work_place?.split(",")[1] || "";
                } else if (filterOption === "거주") {
                  //residence
                  addressFilter = user?.residence?.split(",")[1] || "";
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
                return (
                  index > 3 && (
                    <ClinicCard {...(item as ClinicCardProps)} key={item.id} />
                  )
                );
              }}
            />
          )}
        </div>
      </main>
    </>
  );
}
