"use client";

import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/providers/user-store-provider";
import BottomNavigation from "../../../../components/bottom-navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { getPaginatedReservations } from "@/lib/supabase/services/reservations.services";
import { ReservationListSkeleton } from "@/components/loading-skeletons/reservation-skeleton";
import HeaderWithBackButton from "@/components/header-with-back-button";

export default function ReservationListPage() {
  const userId = useUserStore((selector) => selector.user?.id as string);
  const searchParams = useSearchParams();
  const router = useRouter();
  const accessedFromProfile =
    searchParams.get("accessed_from_profile") === "true";

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["reservations", userId],
    queryFn: async () =>
      await getPaginatedReservations(1, 1000, { patient_id: userId }),
    enabled: !!userId,
  });

  return (
    <>
      {accessedFromProfile ? (
        <HeaderWithBackButton title="예약 목록" />
      ) : (
        <header className="flex flex-col gap-4 mb-5 font-bold font-pretendard-600 text-lg">
          예약 목록
        </header>
      )}
      {isLoading && <ReservationListSkeleton />}

      {reservations?.data.length === 0 && (
        <div className="text-center ">
          예약이 없습니다. {/* No reservations. */}
        </div>
      )}

      {reservations && (
        <div className="flex flex-col gap-4">
          {reservations.data.map((r) => (
            <div
              key={r.id}
              className="flex items-center w-full py-1 text-base cursor-pointer"
              style={{ minHeight: 48 }}
              // onClick={() => router.push(`/patient/reservation/${r.id}`)}
            >
              <span className="font-bold text-black text-left whitespace-nowrap mr-4 min-w-[48px]">
                {r.reservation_time?.slice(0, 5) || "--:--"}
              </span>
              <span className="text-gray-700 truncate flex-1 mr-4 whitespace-nowrap">
                {r.clinic_treatment?.clinic?.clinic_name || "-"} ·{" "}
                {r.clinic_treatment?.treatment?.treatment_name || "-"}
              </span>
              {r.payment && r.payment.length > 0 ? (
                <Button
                  className="rounded-md px-4 h-8 text-sm font-medium bg-blue-600 text-white"
                  variant="outline"
                  tabIndex={-1}
                  disabled
                >
                  결제완료 {/* Payment Complete */}
                </Button>
              ) : (
                <Button
                  className="rounded-md px-4 h-8 text-sm font-medium border border-gray-200 bg-gray-50 text-gray-500"
                  variant="default"
                  tabIndex={-1}
                  onClick={() => router.push(`/patient/reservation/payment`)}
                >
                  결제하기 {/* Pay */}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {!accessedFromProfile && <BottomNavigation />}
    </>
  );
}
