"use client";

import { Button } from "@/components/ui/button";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useUserStore } from "@/providers/user-store-provider";
import BottomNavigation from "../../../../components/bottom-navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { ReservationListSkeleton } from "@/components/loading-skeletons/reservation-skeleton";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { getPaginatedReservations } from "@/lib/supabase/services/reservations.services";
import { ReservationDetailModal } from "@/components/modals/reservation-detail-modal";
import { useState } from "react";

// Constants
const PAGE_SIZE = 10; // Number of reservations per page

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
  const userId = useUserStore((selector) => selector.user?.id);
  const user = useUserStore((selector) => selector.user);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationWithDetails | null>(null);

  // Convert patient reservation to the format expected by the modal
  const convertReservationForModal = (reservation: ReservationWithDetails) => {
    return {
      ...reservation,
      // Add required fields that might be missing
      clinic_treatment_id: "",
      date_reserved: reservation.reservation_date || new Date().toISOString(),
      consultation_type: reservation.consultation_type || "general",
      contact_number: reservation.contact_number || user?.contact_number || "",
      dentist_id: "",
      patient_id: userId || "",
      notes: "",
      status: reservation.status as "pending" | "accepted" | "rejected",
      user: {
        full_name: user?.full_name || "",
        contact_number: user?.contact_number || "",
        birthdate: user?.birthdate || new Date().toISOString(),
      },
    };
  };

  // Infinite Query for reservations
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["reservations", userId, PAGE_SIZE],
      queryFn: async ({ pageParam = 1 }) =>
        getPaginatedReservations(pageParam, PAGE_SIZE, { patient_id: userId }),
      getNextPageParam: (lastPage, allPages) =>
        lastPage?.data?.length === PAGE_SIZE ? allPages.length + 1 : undefined,
      enabled: !!userId,
      initialPageParam: 1,
    });

  // Flatten all loaded reservations
  const allReservations = data?.pages.flatMap((page) => page.data) || [];

  const router = useRouter();
  const searchParams = useSearchParams();
  const accessedFromProfile =
    searchParams.get("accessed_from_profile") === "true";

  return (
    <>
      {accessedFromProfile ? (
        <HeaderWithBackButton title="예약 목록" />
      ) : (
        <>
          <h2 className="font-bold text-xl mb-6">전세 {/* Reservations */}</h2>
          <h2 className="font-bold text-xl mb-4">
            예약 목록 {/* List of Reservations */}
          </h2>
        </>
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
                setDetailModalOpen(true);
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
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedReservation(null);
        }}
        reservation={
          selectedReservation
            ? convertReservationForModal(selectedReservation)
            : null
        }
        // No onConfirm prop - patients shouldn't confirm reservations
      />

      {!accessedFromProfile && <BottomNavigation />}
    </>
  );
}
