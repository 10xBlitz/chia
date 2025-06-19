"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react"; // Make sure you have lucide-react installed

interface KoreanDatePickerProps {
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
}

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

export function KoreanDatePicker({
  value,
  onChange,
  disabled = false,
}: KoreanDatePickerProps) {
  const [displayMonth, setDisplayMonth] = React.useState<Date>(
    value ?? new Date()
  );
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (value) {
      setDisplayMonth(value);
    }
  }, [value]);

  // Prevent popover from opening if disabled
  function handleOpenChange(openState: boolean) {
    if (!disabled) {
      setOpen(openState);
    }
  }

  function onYearChange(yearStr: string) {
    if (disabled) return;
    const year = Number(yearStr);
    const newDate = new Date(displayMonth);
    newDate.setFullYear(year);
    setDisplayMonth(newDate);
  }

  function onMonthChange(monthStr: string) {
    if (disabled) return;
    const month = Number(monthStr);
    const newDate = new Date(displayMonth);
    newDate.setMonth(month);
    setDisplayMonth(newDate);
  }

  return (
    <Popover open={open} modal={true} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          type="button"
          className={cn(
            "w-full text-left flex justify-between font-normal",
            !value && !disabled && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {value
            ? format(value, "yyyy년 M월 d일", { locale: ko })
            : "날짜 선택"}
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-4" align="start">
        {/* Year & Month selectors */}
        <div className="flex justify-center items-center gap-2 mb-2">
          <Select
            value={String(displayMonth.getFullYear())}
            onValueChange={onYearChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="연도" />
            </SelectTrigger>
            <SelectContent className="max-h-48 overflow-auto">
              {YEARS.map((year) => (
                <SelectItem
                  className="cursor-pointer"
                  key={year}
                  value={String(year)}
                >
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(displayMonth.getMonth())}
            onValueChange={onMonthChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="월" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((monthName, idx) => (
                <SelectItem
                  className="cursor-pointer"
                  key={monthName}
                  value={String(idx)}
                >
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="single"
          selected={value}
          onSelect={(selectedDate) => {
            if (disabled) return;
            onChange?.(selectedDate ?? undefined);
            setOpen(false);
          }}
          initialFocus
          locale={ko}
          showOutsideDays
          fixedWeeks
          month={displayMonth}
          onMonthChange={(date) => {
            if (!disabled) setDisplayMonth(date);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
