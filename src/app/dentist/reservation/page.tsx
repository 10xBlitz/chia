"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { supabaseClient } from "@/lib/supabase/client";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { ko } from "date-fns/locale";
import { calculateAge } from "@/lib/utils";
import { useUserStore } from "@/providers/user-store-provider";

export default function DentistReservationPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);
  const user = useUserStore((state) => state.user);

  // Query for reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ["reservations", user?.clinic_id, selectedDate],
    queryFn: () => fetchReservations(user?.clinic_id, selectedDate),
    enabled: !!user?.clinic_id,
  });

  return (
    <>
      <HeaderWithBackButton
        title={format(selectedDate, "M.d.(eee)", { locale: ko })}
      />
      <div className="w-full">
        <Calendar
          locale={ko}
          mode="single"
          selected={selectedDate}
          onSelect={(d) => d && setSelectedDate(d)}
          style={{ minWidth: "100%" }}
          className="sm:w-full sm:min-w-full"
          classNames={{
            months: "flex flex-col  gap-2",
            row: "flex w-full sm:min-w-full mt-2 justify-between",
            day_selected:
              "!bg-[#287DFA] text-white hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          }}
        />
      </div>
      <div className="mt-10">
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
              <div className="flex flex-1">
                <span className="font-bold text-sm w-[50px] text-left">
                  {format(
                    new Date(`${r.reservation_date}T${r.reservation_time}`),
                    "HH:mm"
                  )}
                </span>
                <span className="text-sm text-black flex-1 ml-2 truncate max-w-[80%]">
                  {r.user.full_name} ·{" "}
                  {calculateAge(new Date(r.user.birthdate))}세 ·
                  {r.clinic_treatment.treatment.treatment_name}
                </span>
              </div>
              <Checkbox
                checked={selectedReservationId === r.id}
                onCheckedChange={() => setSelectedReservationId(r.id)}
                className="bg-gray-100 w-5 h-5"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

async function fetchReservations(
  clinicId: string | null | undefined,
  selectedDate: Date
) {
  if (!clinicId) return [];
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data } = await supabaseClient
    .from("reservation")
    .select("*, clinic_treatment(*, treatment(*)), user!patient_id(*)")
    .eq("reservation_date", dateStr)
    .eq("clinic_treatment.clinic_id", clinicId)
    .order("reservation_time", { ascending: true });
  return data ? (Array.isArray(data) ? data : [data]) : [];
}
