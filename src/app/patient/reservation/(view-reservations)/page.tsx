"use client";

export const dynamic = "force-dynamic";

import HeaderWithBackButton from "@/components/header-with-back-button";
import { ReservationListSkeleton } from "@/components/loading-skeletons/reservation-skeleton";
import MainHeader from "@/components/main-header";
import { ReservationDetailModal } from "@/components/modals/reservation-detail-modal";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/providers/user-store-provider";
import { UserState } from "@/stores/user-store";
import { Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import BottomNavigation from "../../../../components/bottom-navigation";
import { useReservationsInfiniteQuery } from "./queries";

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

  // Declare all hooks first (required by Rules of Hooks)
  const {
    allReservations,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReservationsInfiniteQuery(user?.id);

  // Redirect to login if not authenticated
  if (!user || !user.id) {
    router.push("/auth/login");
    return (
      <>
        {accessedFromProfile ? (
          <HeaderWithBackButton title="예약 목록" />
        ) : (
          <MainHeader title="전세" description="예약 목록" />
        )}
        <div className="p-4">
          <ReservationListSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      {accessedFromProfile ? (
        <HeaderWithBackButton title="예약 목록" />
      ) : (
        <MainHeader title="전세" description="예약 목록" />
      )}
      {isLoading && <ReservationListSkeleton />}

      {allReservations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            예약 내역이 없습니다
          </h3>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">
            아직 예약된 시술이 없습니다. <br />
            치아에서 다양한 시술을 찾아보세요!
          </p>
          <Button
            className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-xl"
            onClick={() => router.push("/")}
          >
            시술 찾아보기
          </Button>
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
                      `/patient/payment/reservation?reservation_id=${r.id
                      }&treatment_id=${r.clinic_treatment?.treatment?.id
                      }&treatment_name=${r.clinic_treatment?.treatment?.treatment_name || ""
                      }&clinic_id=${r.clinic_treatment?.clinic?.id
                      }&clinic_name=${r.clinic_treatment?.clinic?.clinic_name || ""
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
