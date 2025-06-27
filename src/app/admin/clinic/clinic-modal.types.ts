import { Enums } from "@/lib/supabase/types";
import { z } from "zod";

// 요일을 한글로, 영어 주석 추가 (Days of week in Korean, with English comments)
export const DAYS_OF_WEEK: Enums<"day_of_week">[] = [
  "월요일", // Monday
  "화요일", // Tuesday
  "수요일", // Wednesday
  "목요일", // Thursday
  "금요일", // Friday
  "토요일", // Saturday
  "일요일", // Sunday
  "점심시간", // Lunch Break
];

// Add ClinicHour type for typing
export type ClinicHour = {
  day_of_week: string;
  time_open: string;
  note?: string;
};

export const formSchema = z.object({
  clinic_name: z
    .string()
    .min(1, "병원 이름을 입력하세요.") // Please enter the clinic name.
    .max(100, "병원 이름은 100자 이내여야 합니다."), // Clinic name must be 100 characters or less.
  contact_number: z
    .string()
    .min(1, "연락처를 입력하세요.") // Please enter the contact number.
    .max(30, "연락처는 30자 이내여야 합니다."), // Contact number must be 30 characters or less.
  full_address: z
    .string()
    .min(1, "주소를 입력하세요.") // Please enter the address.
    .max(200, "주소는 200자 이내여야 합니다."), // Address must be 200 characters or less.
  detail_address: z
    .string()
    .max(100, "상세 주소는 100자 이내여야 합니다.") // Detail address must be 100 characters or less.
    .optional(),
  city: z
    .string()
    .min(1, "도시를 입력하세요.") // Please enter the city.
    .max(50, "도시는 50자 이내여야 합니다."), // City must be 50 characters or less.
  region: z
    .string()
    .min(1, "지역을 입력하세요.") // Please enter the region.
    .max(50, "지역은 50자 이내여야 합니다."), // Region must be 50 characters or less.
  link: z
    .string()
    .max(200, "링크는 200자 이내여야 합니다.") // Link must be 200 characters or less.
    .optional(),
  opening_date: z.date({ required_error: "개원일을 선택하세요." }), // Please select the opening date.
  pictures: z.any().optional(), // For clinic images
  treatments: z.array(
    z.object({
      treatment_id: z.string().nullable(),
      treatment_name: z
        .string()
        .min(1, "진료 항목명을 입력하세요.") // Please enter the treatment name.
        .max(100, "진료 항목명은 100자 이내여야 합니다."), // Treatment name must be 100 characters or less.
      image_url: z.any(),
      action: z.enum(["new", "updated", "deleted", "old"]),
    })
  ),
  clinic_hours: z
    .array(
      z.object({
        day_of_week: z
          .string()
          .min(1, "요일을 입력하세요.") // Please enter the day of week.
          .max(20, "요일은 20자 이내여야 합니다."), // Day of week must be 20 characters or less.
        time_open: z
          .string()
          .min(1, "진료 시간을 입력하세요.") // Please enter the clinic hours.
          .max(50, "진료 시간은 50자 이내여야 합니다."), // Clinic hours must be 50 characters or less.
        note: z.string().max(100, "비고는 100자 이내여야 합니다.").optional(), // Note must be 100 characters or less.
      })
    )
    .optional(),
});
