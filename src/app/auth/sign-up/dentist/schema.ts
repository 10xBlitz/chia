import { z } from "zod";

// Zod schema
export const DentistSignupFormSchema = z
  .object({
    full_name: z.string().min(1, "이름을 입력해주세요."),
    email: z.string().email("유효한 이메일을 입력해주세요."),
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
    confirmPassword: z
      .string()
      .min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
    clinic_id: z.string().min(1, "병원명을 선택해주세요."),
    treatments: z.array(z.string()).min(1, "시술 종류를 선택해주세요."),
    departments: z.array(z.string()).min(1, "진료과목을 선택해주세요."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });
