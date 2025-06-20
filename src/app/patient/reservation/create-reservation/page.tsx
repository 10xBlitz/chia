"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { format } from "date-fns";
import { cn, getKoreanDayOfWeek } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getPaginatedClinicTreatments } from "@/lib/supabase/services/treatments.services";
import { useUserStore } from "@/providers/user-store-provider";
import { PhoneInput } from "@/components/phone-input";
import { supabaseClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { KoreanDatePicker } from "@/components/korean-date-picker-single";
import { KoreanTimePicker } from "@/components/time-picker";
import HeaderWithBackButton from "@/components/header-with-back-button";
import BottomNavigation from "@/components/bottom-navigation";
import { fetchClinicWorkingHours } from "@/lib/supabase/services/working-hour.services";

// Zod schema for validation
const reservationSchema = z.object({
  date: z.date({ required_error: "날짜를 입력하세요." }), // Please enter a date
  time: z.string().min(1, "시간을 입력하세요."), // Please enter a time
  clinicTreatment: z.string().min(1, "관심 시술을 입력하세요."), // Please enter a treatment
  consultationType: z.string().min(1, "상담 유형을 선택하세요."), // Please select consultation type
  contact: z.string(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

// Add WorkingHour type for type safety

export default function CreateReservation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clinic_id = searchParams.get("clinic_id");
  if (!clinic_id) {
    router.push("/patient/home");
  }
  const { data: treatments } = useQuery({
    queryKey: ["treatments"],
    queryFn: async () =>
      await getPaginatedClinicTreatments(clinic_id as string, 1, 100),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const user = useUserStore((state) => state.user);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      date: new Date(),
      time: "",
      clinicTreatment: "",
      consultationType: "",
      contact: "",
    },
  });

  const [loading, setLoading] = useState(false);

  async function onSubmit(values: ReservationFormValues) {
    if (!user?.id) return;
    setLoading(true);
    const { error } = await supabaseClient.from("reservation").insert([
      {
        reservation_date: format(values.date, "yyyy-MM-dd"),
        reservation_time: values.time,
        consultation_type: values.consultationType,
        contact_number: values.contact,
        patient_id: user.id,
        clinic_treatment_id: values.clinicTreatment,
      },
    ]);
    setLoading(false);

    console.log("Reservation created:", values);

    if (error) {
      console.error("Error creating reservation:", error);
      toast.error("예약 요청에 실패했습니다.");
    } else {
      toast.success("예약 요청이 완료되었습니다.");
      router.back();
    }
  }

  const reservationDate = form.watch("date");

  // When the user selects a reservation date:
  const selectedDate = reservationDate; // e.g., from form state
  const selectedDayOfWeek = selectedDate
    ? getKoreanDayOfWeek(selectedDate)
    : undefined;

  const { data: workingHours } = useQuery({
    queryKey: ["working-hours", clinic_id, selectedDayOfWeek],
    queryFn: () =>
      fetchClinicWorkingHours(clinic_id as string, {
        dayOfWeek: selectedDayOfWeek,
      }),
    enabled: !!clinic_id && !!selectedDayOfWeek,
  });

  // workingHours will be an array with 0 or 1 item for the selected day
  const todayHours = workingHours?.[0];
  const { openHour, closeHour } =
    todayHours && todayHours.time_open
      ? parseOpenClose(todayHours.time_open)
      : { openHour: 0, closeHour: 23 };
  const allowedHours = Array.from(
    { length: closeHour - openHour + 1 },
    (_, i) => i + openHour
  );

  useEffect(() => {
    if (workingHours?.length === 0) {
      form.setError("time", {
        type: "manual",
        message: "해당 날짜에 진료 시간이 없습니다. 다른 날짜를 선택해주세요.", // No working hours for this date. Please select another date.
      });
    } else {
      // If there are working hours, clear any previous error
      form.clearErrors("time");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingHours]);

  return (
    <div className="flex flex-col min-h-dvh">
      <HeaderWithBackButton title="예약하기" />
      {/**Make a reservation */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col flex-1 mb-5"
        >
          <div className="flex flex-col gap-6 flex-1">
            <div>
              <FormLabel className="font-semibold">
                희망 시간대 {/**Desired Time Zone */}
              </FormLabel>
              <div className="flex flex-col gap-2 mt-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <KoreanDatePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <KoreanTimePicker
                          disabled={workingHours?.length === 0}
                          time={field.value}
                          setSelected={(e) => field.onChange(e)}
                          allowedHours={allowedHours}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div>
              {treatments?.data && treatments.data.length > 0 && (
                <FormField
                  control={form.control}
                  name="clinicTreatment"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>치료 {/**Treatment */}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? treatments.data.find(
                                    (treatment) => treatment.id === field.value
                                  )?.treatment?.treatment_name
                                : "관심 시술을 선택하세요"}{" "}
                              {/** Select a treatment */}
                              <ChevronsUpDown className="opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="치료법 검색..." // Search treatment
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>
                                치료법이 발견되지 않았습니다{" "}
                                {/**No treatment found. */}
                              </CommandEmpty>
                              <CommandGroup>
                                {treatments.data &&
                                  treatments.data.map((treatment) => (
                                    <CommandItem
                                      value={
                                        treatment?.treatment?.treatment_name
                                      }
                                      key={treatment.id}
                                      onSelect={() => {
                                        form.setValue(
                                          "clinicTreatment",
                                          treatment.id
                                        );
                                      }}
                                    >
                                      {treatment?.treatment?.treatment_name}
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          treatment.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <div>
              <FormLabel className="font-semibold">
                상담 유형 {/**Consultation Type */}
              </FormLabel>
              <FormField
                control={form.control}
                name="consultationType"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full min-h-[45px]">
                          <SelectValue placeholder="상담 유형 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="방문">방문</SelectItem> {/* Visit */}
                        <SelectItem value="전화">전화</SelectItem> {/* Phone */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormLabel className="font-semibold">연락처</FormLabel>
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormControl>
                      <PhoneInput
                        defaultCountry="KR"
                        onChange={field.onChange}
                        value={field.value}
                      />
                    </FormControl>
                    <div className="flex gap-3 mt-2">
                      <Checkbox
                        id="terms"
                        onCheckedChange={(e) =>
                          e
                            ? form.setValue(
                                "contact",
                                user?.contact_number || ""
                              )
                            : form.setValue("contact", "")
                        }
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Use my contact number
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="h-[45px] mb-20 btn-primary"
            disabled={loading}
          >
            {loading ? "요청 중..." : "작성하기"}
            {/**loading ? Loading... : Write */}
          </Button>
        </form>
      </Form>
      <BottomNavigation forceActiveIndex={2} />
    </div>
  );
}

// Parse open/close from time_open string (e.g., "09:00AM - 06:00PM ")
function parseOpenClose(timeOpen: string) {
  // Expects format: "09:00AM - 06:00PM "
  const [open, close] = timeOpen.split("-").map((s) => s.trim());
  // Convert to 24-hour
  const parse = (t: string) => {
    const match = t.match(/(\d{2}):(\d{2})(AM|PM)/i) || [];
    const hour = match[1];
    const ampm = match[3];
    let h = parseInt(hour, 10);
    if (ampm?.toUpperCase() === "PM" && h !== 12) h += 12;
    if (ampm?.toUpperCase() === "AM" && h === 12) h = 0;
    return h;
  };
  return { openHour: parse(open), closeHour: parse(close) };
}
