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
import { Calendar as CalendarIcon } from "lucide-react";

interface KoreanDateRangePickerProps {
  value?: { from: Date; to?: Date };
  onChange?: (range: { from: Date; to?: Date }) => void;
  disabled?: boolean;
}

const YEARS = Array.from(
  { length: 100 },
  (_, i) => new Date().getFullYear() - 50 + i
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

export function KoreanDateRangePicker({
  value,
  onChange,
  disabled = false,
}: KoreanDateRangePickerProps) {
  const [displayMonth, setDisplayMonth] = React.useState<Date>(
    value?.from ?? new Date()
  );
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (value?.from) {
      setDisplayMonth(value.from);
    }
  }, [value?.from]);

  function handleOpenChange(openState: boolean) {
    if (!disabled) setOpen(openState);
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
            "w-full justify-start text-left font-normal",
            !value?.from && !disabled && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from && value?.to
            ? `${format(value.from, "yyyy년 M월 d일", {
                locale: ko,
              })} ~ ${format(value.to, "yyyy년 M월 d일", { locale: ko })}`
            : "날짜 범위 선택"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-4" align="start">
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
                <SelectItem key={year} value={String(year)}>
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
                <SelectItem key={monthName} value={String(idx)}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="range"
          selected={value}
          onSelect={(range) => {
            if (disabled) return;

            if (range?.from && range?.to)
              onChange?.({ from: range.from, to: range.to });
          }}
          initialFocus
          locale={ko}
          showOutsideDays
          fixedWeeks
          numberOfMonths={2}
          month={displayMonth}
          onMonthChange={(date) => {
            if (!disabled) setDisplayMonth(date);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
