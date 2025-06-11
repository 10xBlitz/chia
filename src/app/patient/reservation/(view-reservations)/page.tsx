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

  // Pagination state from searchParams
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);

  const {
    data: reservations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reservations", userId, page, pageSize],
    queryFn: async () =>
      await getPaginatedReservations(page, pageSize, { patient_id: userId }),
    enabled: !!userId,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Helper to update searchParams for pagination
  const setPagination = (newPage: number, newPageSize: number = pageSize) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    params.set("pageSize", String(newPageSize));
    router.push(`?${params.toString()}`);
  };

  console.log("---> error: ", error);

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

      {(reservations?.data?.length ?? 0) === 0 && (
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

      {/* Pagination Controls */}
      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPagination(Math.max(1, page - 1))}
        >
          이전
        </Button>
        <span className="self-center font-medium">{page} 페이지</span>
        <Button
          variant="outline"
          disabled={(reservations?.data?.length ?? 0) < pageSize}
          onClick={() => setPagination(page + 1)}
        >
          다음
        </Button>
      </div>

      {!accessedFromProfile && <BottomNavigation />}
    </>
  );
}
