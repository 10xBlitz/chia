"use client";

import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import BottomNavigation from "../../../../components/bottom-navigation";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { useSearchParams } from "next/navigation";

// Helper to fetch reservations for the current user
async function fetchReservations(userId: string) {
  const { data, error } = await supabaseClient
    .from("reservation")
    .select(
      `
      *,
      clinic_treatment(
        *,
        clinic(clinic_name),
        treatment(treatment_name)
      ),
      payment(*)
    `
    )
    .eq("patient_id", userId)
    .order("reservation_date", { ascending: false })
    .order("reservation_time", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export default function ReservationListPage() {
  const userId = useUserStore((selector) => selector.user?.id as string);
  const searchParams = useSearchParams();
  const accessedFromProfile =
    searchParams.get("accessed_from_profile") === "true";
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (userId) setEnabled(true);
  }, [userId]);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["reservations", userId],
    queryFn: () => fetchReservations(userId),
    enabled: enabled && !!userId,
  });

  return (
    <>
      <HeaderWithBackButton title="예약 목록" />
      {isLoading && <div>로딩 중... {/* Loading... */}</div>}

      {reservations?.length === 0 && (
        <div>예약이 없습니다. {/* No reservations. */}</div>
      )}

      {reservations && (
        <div className="flex flex-col gap-4">
          {reservations.map((r) => (
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
