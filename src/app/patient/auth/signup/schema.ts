// schemas/signup.ts
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

export const step1Schema = z
  .object({
    name: z.string().min(1, { message: "이름은 필수입니다." }),
    email: z.string().min(1, { message: "이메일은 필수입니다." }),
    password: z.string().min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
    confirmPassword: z.string().min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
  })


export const step2Schema = z.object({
  gender: z.string().min(1, { message: "성별은 필수입니다." }),
  birthdate: z.date({required_error:"date is required"}),
  residence: z.string().min(1, { message: "거주가 필요합니다." }),
  workplace: z.string().min(1, { message: "" }),

});

// ✅ Final full schema for form types + final submission
export const fullSchema = step1Schema.merge(step2Schema)

export interface StepInterface {
  form: UseFormReturn<{
    birthdate: Date;
    gender: string;
    residence: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    workplace: string;
}, any, {
    birthdate: Date;
    gender: string;
    residence: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    workplace: string;
}>
}
