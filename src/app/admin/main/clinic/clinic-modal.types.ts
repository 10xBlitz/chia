import { Enums } from "@/lib/supabase/types";
import { z } from "zod";

// Utility function to convert time string (HH:mm) to minutes for comparison
export const timeStringToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

// 요일을 한글로, 영어 주석 추가 (Days of week in Korean, with English comments)
export const DAYS_OF_WEEK: Enums<"day_of_week">[] = [
  "월요일", // Monday
  "화요일", // Tuesday
  "수요일", // Wednesday
  "목요일", // Thursday
  "금요일", // Friday
  "토요일", // Saturday
  "일요일", // Sunday
  "평일 점심시간", // Weekday Lunch Break
  "주말 점심시간", // Weekend Lunch Break
];

// Add ClinicHour type for typing
export type ClinicHour = {
  selected_days: string[];
  time_open_from: string;
  time_open_to: string;
};

// Add a type for the image object with optional oldUrl for updated images
export type ClinicImageFormValue = {
  status: "old" | "new" | "deleted" | "updated";
  file: string | File;
  oldUrl?: string; // Only present for updated images
};

export const formSchema = z.object({
  clinic_name: z
    .string()
    .min(1, "병원 이름을 입력하세요.") // Please enter the clinic name.
    .max(100, "병원 이름은 100자 이내여야 합니다."), // Clinic name must be 100 characters or less.
    is_pinned: z
    .boolean(),
  
  introduction: z
    .string()
    .max(500, "소개글은 500자 이내여야 합니다.") // Introduction must be 500 characters or less.
    .optional(),
  note: z
    .string()
    .max(500, "비고는 500자 이내여야 합니다.") // Note must be 500 characters or less.
    .optional(),
  contact_number: z
    .string()
    .min(1, "연락처를 입력하세요.") // Please enter the contact number.
    .max(30, "연락처는 30자 이내여야 합니다."), // Contact number must be 30 characters or less.
  full_address: z
    .string()
    .min(1, "주소를 입력하세요.") // Please enter the address.
    .max(200, "주소는 200자 이내여야 합니다."), // Address must be 200 characters or less.
  detail_address: z.string().min(1, "필수항목입니다"), // Required field
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
  pictures: z
    .array(
      z.object({
        status: z.enum(["old", "new", "deleted", "updated"]),
        file: z.union([z.string().url(), z.instanceof(File)]),
        oldUrl: z.string().url().optional(), // Only present for updated images
      })
    )
    .optional(), // For clinic images - array of objects with status and file
  treatments: z
    .array(
      z
        .object({
          treatment_id: z.string().nullable(),
          treatment_name: z
            .string()
            .min(1, "진료 항목명을 입력하세요.") // Please enter the treatment name.
            .max(100, "진료 항목명은 100자 이내여야 합니다."), // Treatment name must be 100 characters or less.
          image_url: z.any(),
          action: z.enum(["new", "updated", "deleted", "old"]),
        })
        .refine(
          (treatment) => {
            // Individual treatment validation
            if (treatment.action !== "deleted") {
              return (
                treatment.treatment_id && treatment.treatment_id.trim() !== ""
              );
            }
            return true;
          },
          {
            message: "진료 항목을 선택해주세요.", // Please select a treatment.
            path: ["treatment_id"],
          }
        )
    )
    .refine(
      (treatments) => {
        // Check that all non-deleted treatments have a valid treatment_id
        const nonDeletedTreatments = treatments.filter(
          (t) => t.action !== "deleted"
        );
        return nonDeletedTreatments.every(
          (t) => t.treatment_id && t.treatment_id.trim() !== ""
        );
      },
      {
        message: "모든 진료 항목에는 진료명을 선택해야 합니다.", // All treatments must have a treatment selected.
        path: ["treatments"], // This will show the error at the treatments level
      }
    ),
  clinic_hours: z
    .array(
      z
        .object({
          selected_days: z
            .array(z.string())
            .min(1, "최소 하나의 요일을 선택해주세요."), // Please select at least one day.
          time_open_from: z
            .string()
            .min(1, "진료 시작 시간을 입력하세요.") // Please enter the clinic start time.
            .max(50, "진료 시간은 50자 이내여야 합니다."), // Clinic hours must be 50 characters or less.
          time_open_to: z
            .string()
            .min(1, "진료 종료 시간을 입력하세요.") // Please enter the clinic end time.
            .max(50, "진료 시간은 50자 이내여야 합니다."), // Clinic hours must be 50 characters or less.
        })
        .refine(
          (hour) => {
            // Individual hour validation: from time should be less than to time
            const fromTime = hour.time_open_from;
            const toTime = hour.time_open_to;

            if (!fromTime || !toTime) return true; // Let required validation handle empty fields

            // Convert time strings to minutes for comparison
            const fromMinutes = timeStringToMinutes(fromTime);
            const toMinutes = timeStringToMinutes(toTime);

            return fromMinutes < toMinutes;
          },
          {
            message: "진료 시작 시간은 종료 시간보다 빨라야 합니다.", // Start time must be earlier than end time.
            path: ["time_open_from"], // Show error on the from field
          }
        )
    )
    .optional(),
});
