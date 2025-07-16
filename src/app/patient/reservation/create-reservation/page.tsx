"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import BottomNavigation from "@/components/bottom-navigation";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { KoreanDatePicker } from "@/components/korean-date-picker-single";
import { PhoneInput } from "@/components/phone-input";
import { KoreanTimePicker } from "@/components/time-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { useDebounce } from "@/hooks/use-debounce";
import { sendSolapiSMS } from "@/lib/send-sms";
import {
  getClinic,
  getDisabledWeekdaysForClinic,
} from "@/lib/supabase/services/clinics.services";
import { insertReservation } from "@/lib/supabase/services/reservations.services";
import { getPaginatedClinicTreatments } from "@/lib/supabase/services/treatments.services";
import { fetchClinicWorkingHours } from "@/lib/supabase/services/working-hour.services";
import { cn, getKoreanDayOfWeek } from "@/lib/utils";
import { useUserStore } from "@/providers/user-store-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";

// Zod schema for validation
const reservationSchema = z.object({
  date: z.date({ required_error: "날짜를 입력하세요." }), // Please enter a date
  time: z.string().min(1, "시간을 입력하세요."), // Please enter a time
  clinicTreatment: z.string().min(1, "관심 시술을 입력하세요."), // Please enter a treatment
  consultationType: z.string().min(1, "상담 유형을 선택하세요."), // Please select consultation type
  contact: z.string(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

export default function CreateReservation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const clinic_id = searchParams.get("clinic_id");

  if (!clinic_id) {
    toast.error("클리닉 ID가 없습니다. 다시 시도해주세요."); // No clinic ID. Please try again.
    router.push("/patient/home");
  }

  // State for treatment search
  const [treatmentSearchTerm, setTreatmentSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(treatmentSearchTerm, 300);

  // Query for treatments with search functionality
  const { data: treatments, isLoading } = useQuery({
    queryKey: ["clinic-treatments", clinic_id, debouncedSearchTerm],
    queryFn: async () =>
      await getPaginatedClinicTreatments(
        clinic_id as string,
        1,
        50,
        debouncedSearchTerm ? { treatment_name: debouncedSearchTerm } : {}
      ),
    enabled: !!clinic_id,
  });

  const { data: clinic, error: clinicError } = useQuery({
    queryKey: ["clinic-detail", clinic_id],
    queryFn: () => getClinic(clinic_id as string),
    enabled: !!clinic_id,
  });

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      date: undefined,
      time: "",
      clinicTreatment: "",
      consultationType: "",
      contact: "",
    },
  });

  // Reservation mutation
  const reservationMutation = useMutation({
    mutationFn: async (values: ReservationFormValues) => {
      if (!user?.id) throw new Error("User ID is required");
      await insertReservation({
        reservation_date: format(values.date, "yyyy-MM-dd"),
        reservation_time: values.time,
        consultation_type: values.consultationType,
        contact_number: values.contact,
        patient_id: user.id,
        clinic_treatment_id: values.clinicTreatment,
      });
      return values;
    },
    onSuccess: async () => {
      const to = clinic?.user?.contact_number as string; // Replace with the recipient's phone number

      // Compose SMS text in English for the dentist
      const dentistName = clinic?.user?.full_name || "Dentist";
      const customerName = user?.full_name || user?.email || "Customer";
      const smsText = `안녕하세요, #${dentistName}님.\n\n#${customerName}님이 예약을 생성했습니다.`; // Hello, #{dentistName}. #{customerName} has requested a reservation.
      const smsResult = await sendSolapiSMS({ to, text: smsText });

      //display toast success message even though sms is not sent
      toast.success("예약 요청이 완료되었습니다"); // Reservation request completed

      if (!smsResult.ok) {
        console.log(
          "-------->ERROR: 예약 요청이 완료되었습니다. (SMS 전송 실패)"
        );
        console.log(`------>ERROR: 메시지 전송 실패: ${smsResult.error}`);
      }

      queryClient.invalidateQueries({ queryKey: ["reservations", user?.id] });
      router.back();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(
        "예약 요청에 실패했습니다." + // Reservation request failed
          (error?.message ? `: ${error.message}` : "")
      );
    },
  });

  async function onSubmit(values: ReservationFormValues) {
    if (!user?.id) return;
    reservationMutation.mutate(values);
  }

  const reservationDate = form.watch("date");

  // When the user selects a reservation date:
  const selectedDate = reservationDate; // e.g., from form state
  const selectedDayOfWeek = selectedDate
    ? getKoreanDayOfWeek(selectedDate)
    : undefined;

  // --- Add logic to get disabled weekdays for the clinic ---
  const [disabledWeekdays, setDisabledWeekdays] = useState<number[]>([]);
  useEffect(() => {
    if (clinic_id) {
      getDisabledWeekdaysForClinic(clinic_id).then(setDisabledWeekdays);
    }
  }, [clinic_id]);

  const { data: workingHours } = useQuery({
    queryKey: ["working-hours", clinic_id, selectedDayOfWeek],
    queryFn: () =>
      fetchClinicWorkingHours(clinic_id as string, {
        dayOfWeek: selectedDayOfWeek,
      }),
    enabled: !!clinic_id && !!selectedDayOfWeek,
  });

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

  // Build allowedTimes: all 10-min slots from all working hour ranges for the selected day
  const [allowedTimes, setAllowedTimes] = useState<string[]>([]);

  useEffect(() => {
    if (!workingHours) {
      setAllowedTimes([]);
      return;
    }
    const slots = (workingHours || [])
      .flatMap((wh) => {
        const [fromHour, fromMinute] = wh.time_open_from.split(":").map(Number);
        const [toHour, toMinute] = wh.time_open_to.split(":").map(Number);
        const slots: string[] = [];
        let hour = fromHour;
        let minute = fromMinute;
        while (hour < toHour || (hour === toHour && minute <= toMinute)) {
          const h = hour.toString().padStart(2, "0");
          const m = minute.toString().padStart(2, "0");
          slots.push(`${h}:${m}`);
          minute += 10;
          if (minute >= 60) {
            minute = 0;
            hour += 1;
          }
        }
        return slots;
      })
      .filter((v, i, arr) => arr.indexOf(v) === i) // remove duplicates
      .sort();
    setAllowedTimes(slots);
  }, [workingHours]);

  if (clinicError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-lg font-semibold text-red-600">
          클리닉 정보를 불러오는 데 실패했습니다.{" "}
          {/* Failed to load clinic information. */}
        </h2>
        <Button className="mt-4" onClick={() => router.push("/patient/home")}>
          홈으로 돌아가기 {/* Go back to home */}
        </Button>
      </div>
    );
  }

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
                          disabledWeekdays={disabledWeekdays}
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
                          time={field.value}
                          setSelected={(e) => field.onChange(e)}
                          allowedTimes={allowedTimes}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="clinicTreatment"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>치료 {/**Treatment */}</FormLabel>
                  <Popover
                    onOpenChange={(open) => {
                      if (open && field.value) {
                        // When opening, show the selected treatment name in search
                        const selectedTreatment = treatments?.data?.find(
                          (treatment) => treatment.id === field.value
                        );
                        if (selectedTreatment) {
                          setTreatmentSearchTerm(
                            selectedTreatment.treatment?.treatment_name || ""
                          );
                        }
                      } else if (!open) {
                        // When closing, clear the search term
                        setTreatmentSearchTerm("");
                      }
                    }}
                  >
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
                            ? treatments?.data &&
                              treatments.data.find(
                                (treatment) => treatment.id === field.value
                              )?.treatment?.treatment_name
                            : "관심 시술을 선택하세요"}{" "}
                          {/** Select a treatment */}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="치료법 검색..." // Search treatment
                          className="h-9"
                          value={treatmentSearchTerm}
                          onValueChange={setTreatmentSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {isLoading ? (
                              <div className="py-2">검색 중...</div> // Searching...
                            ) : (
                              "치료법이 발견되지 않았습니다" // No treatment found
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {!isLoading &&
                              treatments?.data &&
                              treatments.data.length > 0 &&
                              treatments.data.map((treatment) => (
                                <CommandItem
                                  value={treatment?.treatment?.treatment_name}
                                  key={treatment.id}
                                  onSelect={() => {
                                    form.setValue(
                                      "clinicTreatment",
                                      treatment.id
                                    );
                                    setTreatmentSearchTerm(""); // Clear search after selection
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
                        내 정보 입력 {/* Enter my information */}
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
            className="h-[45px] mb-20"
            disabled={reservationMutation.status === "pending"}
          >
            {reservationMutation.status === "pending"
              ? "요청 중..."
              : "작성하기"}
            {/**loading ? Loading... : Write */}
          </Button>
        </form>
      </Form>
      <BottomNavigation forceActiveIndex={2} />
    </div>
  );
}
