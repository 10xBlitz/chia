"use client";

import { useEffect, useState } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { format, lastDayOfMonth } from "date-fns";
import { supabaseClient } from "@/lib/supabase/client";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { ko } from "date-fns/locale";
import { calculateAge } from "@/lib/utils";
import { useUserStore } from "@/providers/user-store-provider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { ReservationDotCalendar } from "@/components/ui/reservation-dot-calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { updateReservation } from "@/lib/supabase/services/reservations.services";
import { sendSolapiSMS } from "@/lib/send-sms";
import { Tables } from "@/lib/supabase/types";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { ReservationDetailModal } from "@/components/modals/reservation-detail-modal";
import toast from "react-hot-toast";

const YEARS = Array.from(
  { length: 300 },
  (_, i) => new Date().getFullYear() - 100 + i
);
const MONTHS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

// Reservation type with user for mutation
interface ReservationWithUser extends Tables<"reservation"> {
  user: {
    full_name: string;
    contact_number: string;
    birthdate: string;
  };
  clinic_treatment?: {
    treatment?: {
      treatment_name?: string;
    };
  };
  notes?: string;
}

export default function DentistReservationPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date());
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [reservationToConfirm, setReservationToConfirm] =
    useState<ReservationWithUser | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [reservationDetail, setReservationDetail] =
    useState<ReservationWithUser | null>(null);
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    setDisplayMonth(selectedDate);
  }, [selectedDate]);

  // Query for reservations using infinite query
  const {
    data: reservationsData,
    isLoading: reservationsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "reservations",
      user?.clinic_id,
      selectedDate.getDate(),
      selectedDate.getMonth(),
      selectedDate.getFullYear(),
    ],
    queryFn: ({ pageParam = 1 }) =>
      fetchReservations(user?.clinic_id, selectedDate, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < ITEMS_PER_PAGE) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    enabled: !!user?.clinic_id,
  });

  // Flatten the infinite query data
  const reservations = reservationsData?.pages.flat() || [];

  // Collect all reservation dates in the current month for dot marking
  const { data: reservationDays = [] } = useQuery({
    queryKey: [
      "reservation-days",
      user?.clinic_id,
      displayMonth.getMonth(),
      displayMonth.getFullYear(),
    ],
    queryFn: async () => {
      if (!user?.clinic_id) return [];
      const year = format(displayMonth, "yyyy");
      const lastDay = format(lastDayOfMonth(displayMonth), "dd");
      const { data } = await supabaseClient
        .from("reservation")
        .select(
          "reservation_date, clinic_treatment!inner(*, clinic!inner(status), treatment!inner(status))"
        )
        .eq("clinic_treatment.clinic_id", user.clinic_id)
        .eq("clinic_treatment.treatment.status", "active") // Only show reservations for active treatments
        .eq("clinic_treatment.clinic.status", "active") // Only show reservations from active clinics
        .eq("clinic_treatment.status", "active") // Only show active clinic treatments
        .gte("reservation_date", `${year}-${format(displayMonth, "MM")}-01`)
        .lte(
          "reservation_date",
          `${year}-${format(displayMonth, "MM")}-${lastDay}`
        )
        .order("reservation_date", { ascending: true });
      // Return unique dates as strings
      return data
        ? Array.from(new Set(data.map((r) => r.reservation_date)))
        : [];
    },
    enabled: !!user?.clinic_id && !!displayMonth,
  });

  // Accept reservation mutation
  const acceptReservationMutation = useMutation({
    mutationFn: async (reservation: ReservationWithUser) => {
      // 1. Update reservation status
      await updateReservation(reservation.id, { status: "accepted" });
      // 2. Send SMS to patient
      const smsText = `안녕하세요 ${reservation.user.full_name}님,\n\n${user?.clinic?.clinic_name}에서 예약확정했습니다.`;
      // Hello ${reservation.user.full_name}, your reservation has been confirmed by ${ user?.clinic?.clinic_name || "the clinic"}.
      await sendSolapiSMS({
        to: reservation.user.contact_number,
        text: smsText,
      });
    },
    onSuccess: () => {
      toast.success("예약이 확정되었습니다."); // Reservation has been confirmed.
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setConfirmModalOpen(false);
      setReservationToConfirm(null);
    },
  });

  // Navigation handlers
  const handlePrevMonth = () => {
    setDisplayMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };
  const handleNextMonth = () => {
    setDisplayMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <>
      <HeaderWithBackButton
        title={format(selectedDate, "M.d.(eee)", { locale: ko })}
      />
      <div className="w-full">
        <ReservationDotCalendar
          selected={selectedDate}
          onSelect={(d) => d && setSelectedDate(d)}
          displayMonth={displayMonth}
          onMonthChange={setDisplayMonth}
          reservationDays={reservationDays}
        />

        {/* Year & Month selectors and navigation */}
        <div className="flex justify-center items-center gap-2 mt-2">
          <button
            type="button"
            aria-label="이전 달"
            className="rounded-md p-2 hover:bg-accent transition"
            onClick={handlePrevMonth}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <Select
            value={String(displayMonth.getFullYear())}
            onValueChange={(yearStr) => {
              const year = Number(yearStr);
              const newDate = new Date(displayMonth);
              newDate.setFullYear(year);
              setDisplayMonth(newDate);
            }}
          >
            <SelectTrigger className="w-full max-w-[100px]">
              <SelectValue placeholder="연도" />
            </SelectTrigger>
            <SelectContent className="max-h-48 overflow-auto">
              {YEARS.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(displayMonth.getMonth())}
            onValueChange={(monthStr) => {
              const month = Number(monthStr);
              const newDate = new Date(displayMonth);
              newDate.setMonth(month);
              setDisplayMonth(newDate);
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="월" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((monthName, idx) => (
                <SelectItem key={monthName} value={String(idx)}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            aria-label="다음 달"
            className="rounded-md p-2 hover:bg-accent transition"
            onClick={handleNextMonth}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="mt-10 pb-10 ">
        <h2 className="font-bold text-lg mb-2">
          예약 내역 {/**Reservation details */}
        </h2>
        <div className="space-y-2">
          {reservationsLoading && (
            <div className="text-gray-400 text-center py-8">
              불러오는 중... {/**Loading... */}
            </div>
          )}
          {!reservationsLoading && reservations.length === 0 && (
            <div className="text-gray-400 text-center py-8">
              예약이 없습니다. {/**There are no reservations. */}
            </div>
          )}
          {reservations.map((r) => (
            <div
              key={r.id}
              className="flex items-center mt-8 justify-between w-full py-2"
            >
              <div
                className="flex flex-1 cursor-pointer"
                onClick={() => {
                  setReservationDetail(r);
                  setDetailModalOpen(true);
                }}
              >
                <span className="font-bold text-sm w-[50px] text-left">
                  {format(
                    new Date(`${r.reservation_date}T${r.reservation_time}`),
                    "HH:mm"
                  )}
                </span>
                <span className="text-sm text-black flex-1 ml-2 truncate max-w-[80%]">
                  {r.user.full_name} ·{" "}
                  {calculateAge(new Date(r.user.birthdate))}세 ·
                  {r?.clinic_treatment?.treatment?.treatment_name}
                </span>
              </div>
              <Checkbox
                checked={
                  selectedReservationId === r.id || r.status === "accepted"
                }
                onCheckedChange={() => {
                  if (r.status !== "accepted") {
                    setSelectedReservationId(r.id);
                    setReservationToConfirm(r);
                    setConfirmModalOpen(true);
                  }
                }}
                className="bg-gray-100 w-5 h-5"
                disabled={
                  acceptReservationMutation.isPending || r.status === "accepted"
                }
              />
            </div>
          ))}

          {/* Load More Button */}
          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-5 py-2 border-1 border-gray-200 text-sm  text-black rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {
                  isFetchingNextPage
                    ? "로딩 중..." /* Loading... */
                    : "더 보기" /* Load More */
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={confirmModalOpen}
        onConfirm={() => {
          if (reservationToConfirm) {
            acceptReservationMutation.mutate(reservationToConfirm);
          }
        }}
        onCancel={() => {
          setConfirmModalOpen(false);
          setReservationToConfirm(null);
          setSelectedReservationId(null);
        }}
        title="예약 확정"
        description={`${reservationToConfirm?.user.full_name}님의 예약을 확정하시겠습니까?`}
        secondDecription="확정 시 환자에게 SMS가 발송됩니다."
        confirmLabel="확정"
        confirmLoadingLabel="확정 중..."
        cancelLabel="취소"
        confirmButtonClassName="bg-blue-600 text-white hover:bg-blue-700"
        cancelButtonClassName="bg-gray-200 text-gray-800 hover:bg-gray-300"
        loading={acceptReservationMutation.isPending}
      />

      {/* Reservation Detail Modal */}
      <ReservationDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setReservationDetail(null);
        }}
        reservation={reservationDetail}
        onConfirm={(reservation) => {
          setReservationToConfirm(reservation);
          setConfirmModalOpen(true);
          setDetailModalOpen(false);
        }}
      />
    </>
  );
}

// Configuration for pagination
const ITEMS_PER_PAGE = 10;

async function fetchReservations(
  clinicId: string | null | undefined,
  selectedDate: Date,
  page: number = 1
) {
  if (!clinicId) return [];

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = page * ITEMS_PER_PAGE - 1;

  const { data } = await supabaseClient
    .from("reservation")
    .select("*, clinic_treatment!inner(*, treatment(*)), user!patient_id(*)")
    .eq("reservation_date", dateStr)
    .eq("clinic_treatment.clinic_id", clinicId)
    .order("status", { ascending: true }) // pending comes before accepted
    .order("reservation_time", { ascending: true })
    .range(startIndex, endIndex);

  return data ? (Array.isArray(data) ? data : [data]) : [];
}
