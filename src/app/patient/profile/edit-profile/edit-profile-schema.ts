import { z } from "zod";

// Zod schema for validation
export const editPatientProfileSchema = z.object({
  full_name: z.string().min(2, "이름을 2자 이상 입력해주세요."), // Name at least 2 chars
  contact_number: z.string().min(9, "연락처를 올바르게 입력해주세요."), // Simple length check
  residence: z.string({ required_error: "주소를 입력해주세요." }), //Please enter your address.
  birthdate: z.date({ required_error: "생년월일을 입력하세요." }), //Please enter your date of birth.
  gender: z.string({ required_error: "성별을 입력해주세요." }), //Please enter your gender
  work_place: z.string({ required_error: "귀하의 근무지를 입력해 주세요." }), //Please enter your workplace.
});
