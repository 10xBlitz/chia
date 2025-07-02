"use client";

import { useState, useEffect } from "react";
import { format, setHours, setMinutes } from "date-fns";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type KoreanTimePickerProps = {
  time: string | null; // e.g., "14:30"
  setSelected: (value: string) => void;
  disabled?: boolean;
  className?: string;
  allowedHours?: number[]; // Only show these hours if provided
  allowedTimes?: string[]; // Only allow these exact times (e.g., ["09:00", "09:30"])
};

export function KoreanTimePicker({
  time,
  setSelected,
  disabled,
  className,
  allowedHours,
  allowedTimes,
}: KoreanTimePickerProps) {
  const [hour, setHour] = useState<number | null>(null);
  const [minute, setMinute] = useState<number | null>(null);

  const [openHour, setOpenHour] = useState(false);
  const [openMinute, setOpenMinute] = useState(false);

  useEffect(() => {
    if (time) {
      // Expect format like "14:30"
      const [h, m] = time.split(":").map(Number);
      setHour(h);
      setMinute(m);
    }
  }, [time]);

  useEffect(() => {
    if (hour !== null && minute !== null) {
      const date = setMinutes(setHours(new Date(), hour), minute);
      const formatted = format(date, "HH:mm"); // 24-hour format
      setSelected(formatted);
    }
  }, [hour, minute, setSelected]);

  // If allowedTimes is provided, filter hours/minutes accordingly
  let hours: number[];
  let minutes: number[];
  if (allowedTimes && allowedTimes.length > 0) {
    // Extract unique hours and minutes from allowedTimes
    const hourSet = new Set<number>();
    const minuteSet = new Set<number>();
    allowedTimes.forEach((t) => {
      const [h, m] = t.split(":").map(Number);
      hourSet.add(h);
      minuteSet.add(m);
    });
    hours = Array.from(hourSet).sort((a, b) => a - b);
    // If an hour is selected, only show minutes for that hour
    if (hour !== null) {
      minutes = allowedTimes
        .filter((t) => Number(t.split(":")[0]) === hour)
        .map((t) => Number(t.split(":")[1]))
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .sort((a, b) => a - b);
    } else {
      minutes = Array.from(minuteSet).sort((a, b) => a - b);
    }
  } else {
    hours = allowedHours ?? Array.from({ length: 24 }, (_, i) => i);
    minutes = Array.from({ length: 60 }, (_, i) => i);
  }

  return (
    <div className="flex gap-2">
      {/* Hour Picker */}
      <Popover open={openHour} onOpenChange={setOpenHour}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("flex-1 justify-start", className)}
            disabled={disabled}
          >
            {hour !== null ? `${hour}` : "시간"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-28 max-h-60 ">
          <Command>
            <CommandInput placeholder="시 검색..." />
            <CommandList>
              {hours.map((h) => (
                <CommandItem
                  key={h}
                  onSelect={() => {
                    setHour(h);
                    setOpenHour(false);
                    // If allowedTimes, auto-select the first valid minute for this hour
                    if (allowedTimes && allowedTimes.length > 0) {
                      const validMinutes = allowedTimes
                        .filter((t) => Number(t.split(":")[0]) === h)
                        .map((t) => Number(t.split(":")[1]))
                        .sort((a, b) => a - b);
                      if (validMinutes.length > 0) setMinute(validMinutes[0]);
                    }
                  }}
                >
                  {h}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <span className="text-2xl translate-y-1">:</span>
      {/* Minute Picker */}
      <Popover open={openMinute} onOpenChange={setOpenMinute}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex-1 justify-start"
            disabled={disabled}
          >
            {minute !== null ? minute.toString().padStart(2, "0") : "분"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-28 max-h-60">
          <Command>
            <CommandInput placeholder="분 검색..." />
            <CommandList>
              {minutes.map((m) => {
                // If allowedTimes, only show minutes that combine with selected hour to a valid time
                if (allowedTimes && allowedTimes.length > 0 && hour !== null) {
                  const timeStr = `${hour.toString().padStart(2, "0")}:${m
                    .toString()
                    .padStart(2, "0")}`;
                  if (!allowedTimes.includes(timeStr)) return null;
                }
                return (
                  <CommandItem
                    key={m}
                    onSelect={() => {
                      setMinute(m);
                      setOpenMinute(false);
                    }}
                  >
                    {m.toString().padStart(2, "0")}
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
