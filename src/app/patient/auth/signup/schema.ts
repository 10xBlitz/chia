// schemas/signup.ts
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

export const step1Schema = z
  .object({
    name: z.string().min(1, { message: "이름은 필수입니다." }), // Name is required.
    email: z.string().min(1, { message: "이메일은 필수입니다." }), // Email is required.
    password: z.string().min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }), // Password must be at least 6 characters.
    confirmPassword: z.string().min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }), // Password must be at least 6 characters.
  })

export const step2Schema = z.object({
    gender: z.string().min(1, { message: "성별은 필수입니다." }), // Gender is required.
    contact_number: z
        .string()
        .min(9, "최소 9자리 숫자여야 합니다.") // Must be at least 9 digits
        .max(11, "최대 11자리 숫자입니다."), // Must be at most 11 digits
    birthdate: z.date({ required_error: "생년월일은 필수입니다." }), // Date is required
    residence: z.string().min(1, { message: "거주지는 필수입니다." }), // Residence is required.
    workplace: z.string().min(1, { message: "직장 정보는 필수입니다." }), // Workplace is required.
});

// ✅ Final full schema for form types + final submission
export const fullSchema = step1Schema.merge(step2Schema)

export interface StepInterface {
  form: UseFormReturn<{
    gender: string;
    contact_number: string;
    birthdate: Date;
    residence: string;
    workplace: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}, any, {
    gender: string;
    contact_number: string;
    birthdate: Date;
    residence: string;
    workplace: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}>,
confirmPasswordError?:string
}
