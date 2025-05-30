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

async function fetchClinicId() {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabaseClient
    .from("user")
    .select("clinic_id")
    .eq("id", user.id)
    .single();
  if (!error && data?.clinic_id) return data.clinic_id as string;
  return null;
}

async function fetchReservations(clinicId: string | null, selectedDate: Date) {
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

export default function DentistReservationPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);

  // Query for clinicId
  const { data: clinicId, isLoading: clinicLoading } = useQuery({
    queryKey: ["clinicId"],
    queryFn: fetchClinicId,
    staleTime: 1000 * 60 * 5,
  });

  // Query for reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ["reservations", clinicId, selectedDate],
    queryFn: () => fetchReservations(clinicId as string, selectedDate),
    enabled: !!clinicId,
    staleTime: 1000 * 30,
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
          {(clinicLoading || reservationsLoading) && (
            <div className="text-gray-400 text-center py-8">
              불러오는 중... {/**Loading... */}
            </div>
          )}
          {!clinicLoading &&
            !reservationsLoading &&
            reservations.length === 0 && (
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
