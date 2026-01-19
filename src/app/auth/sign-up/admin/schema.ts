import { z } from "zod";

// Step 1: Basic Info
export const adminStep1Schema = z.object({
  full_name: z.string().min(1, "이름을 입력해주세요."), // Name
  email: z.string().email("유효한 이메일을 입력해주세요."), // Email
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."), // Password
  confirmPassword: z.string(), // Confirm Password
});

// Step 2: Personal Info
export const adminStep2Schema = z.object({
  gender: z.string().min(1, { message: "성별은 필수입니다." }), // Gender
  contact_number: z
    .string()
    .min(9, "최소 9자리 숫자여야 합니다.") // At least 9 digits
    .max(13, "최대 13자리 숫자입니다."), // At most 13 digits
  birthdate: z.date({ required_error: "생년월일은 필수입니다." }), // Birthdate
  residence: z.string().optional(), // Residence is optional
  work_place: z.string().optional(), // Workplace is optional
});

// Final schema for validation (no step 3 for admin)
export const AdminSignupFormSchema = adminStep1Schema
  .merge(adminStep2Schema)
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

export type AdminSignupFormType = z.infer<typeof AdminSignupFormSchema>;
