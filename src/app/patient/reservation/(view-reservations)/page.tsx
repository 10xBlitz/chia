"use client";

import { Button } from "@/components/ui/button";
import { useUserStore } from "@/providers/user-store-provider";
import BottomNavigation from "../../../../components/bottom-navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { ReservationListSkeleton } from "@/components/loading-skeletons/reservation-skeleton";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { ReservationDetailModal } from "@/components/modals/reservation-detail-modal";
import { useState } from "react";
import { UserState } from "@/stores/user-store";
import { useReservationsInfiniteQuery } from "./queries";
import MainHeader from "@/components/main-header";

// Reservation type for the modal
interface ReservationWithDetails {
  id: string;
  reservation_date: string;
  reservation_time: string;
  contact_number: string;
  status: string;
  consultation_type?: string;
  clinic_treatment?: {
    treatment?: {
      treatment_name?: string;
    };
    clinic?: {
      clinic_name?: string;
    };
  };
  payment?: unknown[];
}

export default function ReservationListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((selector) => selector.user);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationWithDetails | null>(null);

  //this is used to conditionally show the bottom nav
  const accessedFromProfile =
    searchParams.get("accessed_from_profile") === "true";

  // Infinite Query for reservations
  const {
    allReservations,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReservationsInfiniteQuery(user?.id);

  return (
    <>
      {accessedFromProfile ? (
        <HeaderWithBackButton title="예약 목록" />
      ) : (
        <MainHeader title="전세" description="예약 목록" />
      )}
      {isLoading && <ReservationListSkeleton />}

      {allReservations.length === 0 && (
        <div className="text-center ">
          예약이 없습니다. {/* No reservations. */}
        </div>
      )}

      {allReservations.length > 0 && (
        <div className="flex flex-col gap-4">
          {allReservations.map((r) => (
            <div
              key={r.id}
              className="flex items-center w-full py-1 text-base cursor-pointer"
              style={{ minHeight: 48 }}
              onClick={() => {
                setSelectedReservation(r);
              }}
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
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the modal from opening
                    router.push(
                      `/patient/payment/reservation?reservation_id=${
                        r.id
                      }&treatment_id=${
                        r.clinic_treatment?.treatment?.id
                      }&treatment_name=${
                        r.clinic_treatment?.treatment?.treatment_name || ""
                      }&clinic_id=${
                        r.clinic_treatment?.clinic?.id
                      }&clinic_name=${
                        r.clinic_treatment?.clinic?.clinic_name || ""
                      }&total_amount=${0}`
                    );
                  }}
                >
                  결제하기 {/* Pay */}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Infinite Pagination Controls */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "로딩 중..." : "더 보기"} {/* Load more */}
          </button>
        </div>
      )}

      {/* Reservation Detail Modal */}
      <ReservationDetailModal
        open={!!selectedReservation}
        onClose={() => {
          setSelectedReservation(null);
        }}
        reservation={
          selectedReservation
            ? convertReservationForModal(selectedReservation, user)
            : null
        }
      />

      {!accessedFromProfile && <BottomNavigation />}
    </>
  );
}

// Convert patient reservation to the format expected by the modal
const convertReservationForModal = (
  reservation: ReservationWithDetails,
  user: UserState["user"]
) => {
  return {
    ...reservation,
    // Add required fields that might be missing
    clinic_treatment_id: "",
    date_reserved: reservation.reservation_date || new Date().toISOString(),
    consultation_type: reservation.consultation_type || "general",
    contact_number: reservation.contact_number || user?.contact_number || "",
    dentist_id: "",
    patient_id: user?.id || "",
    status: reservation.status as "pending" | "accepted" | "rejected",
    user: {
      full_name: user?.full_name || "",
      contact_number: user?.contact_number || "",
      birthdate: user?.birthdate || new Date().toISOString(),
    },
  };
};
