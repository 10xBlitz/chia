"use client";

import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import * as React from "react";

interface ReservationDotCalendarProps {
  selected: Date;
  onSelect: (date: Date) => void;
  displayMonth: Date;
  onMonthChange: (date: Date) => void;
  reservationDays: string[]; // Array of 'yyyy-MM-dd' strings
  className?: string;
}

export function ReservationDotCalendar({
  selected,
  onSelect,
  displayMonth,
  onMonthChange,
  reservationDays,
  className = "",
}: ReservationDotCalendarProps) {
  return (
    <Calendar
      locale={ko}
      mode="single"
      selected={selected}
      onSelect={(d) => d && onSelect(d)}
      style={{ minWidth: "100%" }}
      hideNavigation
      className={className + " sm:w-full sm:min-w-full"}
      classNames={{
        months: "flex flex-col gap-2",
        row: "flex w-full sm:min-w-full mt-2 justify-between",
        day_selected:
          "!bg-[#287DFA] text-white hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
      }}
      month={displayMonth}
      onMonthChange={onMonthChange}
      modifiers={{
        hasReservation: (date) =>
          reservationDays.includes(format(date, "yyyy-MM-dd")),
      }}
      modifiersClassNames={{
        hasReservation: "has-reservation-dot",
      }}
    />
  );
}
