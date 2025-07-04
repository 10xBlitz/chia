"use client";

import { InfiniteList } from "@/components/supabase-infinite-list";
import { useUserStore } from "@/providers/user-store-provider";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { UserIcon } from "lucide-react";
import TreatmentCategoryScroll from "@/components/treatment-category";
import ClinicCard from "@/components/clinic-card";
import MobileLayout from "@/components/layout/mobile-layout";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/back-button";

export default function ClinicsPage() {
  const searchParams = useSearchParams();
  const params = useParams<{ treatment_id: string }>();
  const filterOption = searchParams.get("searchByAddress") || "모두"; // Default to "모두" "All"
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  const handleSortOptionChange = (option: string) => {
    router.push(`?searchByAddress=${option}`, { scroll: false });
  };

  return (
    <MobileLayout className="!px-0">
      <div className="flex flex-col">
        <header className="pb-3 flex justify-between items-center px-4">
          <BackButton link="/" />
          {user?.id && user.role ? (
            <Link href="/patient/profile">
              <UserIcon className="min-w-7 min-h-7" />
            </Link>
          ) : (
            <Button className="bg-white text-black border-1 hover:bg-black/20">
              로그인 {/**Login */}
            </Button>
          )}
        </header>

        <main className="flex-1 overflow-hidden flex flex-col h-full pb-16">
          <TreatmentCategoryScroll activeId={params.treatment_id} />

          {/* Sorting options */}
          <div className="flex justify-end items-center px-8 py-2">
            {user?.id && user.role && (
              <Select
                value={filterOption}
                onValueChange={handleSortOptionChange}
              >
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
          <div className="flex flex-col gap-4 flex-1">
            {/* 5. Rest of clinics with infinite scroll */}
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
                //we store work address as "city,region" in database
                //we store residence as "city,region" in database
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
                q.filter(
                  "clinic_treatment.treatment_id",
                  "eq",
                  params.treatment_id
                );
                q.not("clinic_treatment", "is", null);
                q.order("clinic_name", { ascending: true });

                return q;
              }}
              renderItem={(item) => {
                console.log("--->item: ", item);
                /* eslint-disable @typescript-eslint/no-explicit-any */
                return (
                  <ClinicCard {...(item as unknown as any)} key={item.id} />
                );
              }}
            />
          </div>
        </main>
        {user?.id && user.role && <BottomNavigation />}
      </div>
    </MobileLayout>
  );
}
