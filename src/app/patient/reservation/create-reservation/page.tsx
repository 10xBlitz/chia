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
import { useState } from "react";
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
import { cn } from "@/lib/utils";
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
  const clinic_id = searchParams.get("clinic_id");
  if (!clinic_id) {
    router.push("/patient/home");
  }
  const { data: treatments } = useQuery({
    queryKey: ["treatments"],
    queryFn: async () =>
      await getPaginatedClinicTreatments(clinic_id as string, 1, 100),
    staleTime: 1000 * 60 * 5,
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
                          time={field.value}
                          setSelected={(e) => field.onChange(e)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div>
              {treatments?.data && (
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
                                        treatment?.treatment.treatment_name
                                      }
                                      key={treatment.id}
                                      onSelect={() => {
                                        form.setValue(
                                          "clinicTreatment",
                                          treatment.id
                                        );
                                      }}
                                    >
                                      {treatment.treatment.treatment_name}
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
            className="h-[45px] btn-primary"
            disabled={loading}
          >
            {loading ? "요청 중..." : "요청하기"}
            {/**loading ? Loading... : Make a request */}
          </Button>
        </form>
      </Form>
    </div>
  );
}
