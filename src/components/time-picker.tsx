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
};

export function KoreanTimePicker({
  time,
  setSelected,
  disabled,
  className,
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

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

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
            {hour !== null ? `${hour}` : "시"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-28 max-h-60 overflow-auto">
          <Command>
            <CommandInput placeholder="시 검색..." />
            <CommandList>
              {hours.map((h) => (
                <CommandItem
                  key={h}
                  onSelect={() => {
                    setHour(h);
                    setOpenHour(false);
                  }}
                >
                  {h}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Minute Picker */}
      <Popover open={openMinute} onOpenChange={setOpenMinute}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex-1 justify-start">
            {minute !== null ? minute.toString().padStart(2, "0") : "분"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-28 max-h-60 overflow-auto">
          <Command>
            <CommandInput placeholder="분 검색..." />
            <CommandList>
              {minutes.map((m) => (
                <CommandItem
                  key={m}
                  onSelect={() => {
                    setMinute(m);
                    setOpenMinute(false);
                  }}
                >
                  {m.toString().padStart(2, "0")}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
