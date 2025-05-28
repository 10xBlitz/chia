import { z } from "zod";

export const QUOTATION_MAX_IMAGES = 5;
export const QUOTATION_MAX_TEXT = 500;

// --- Form Schema ---
export const quotationSchema = z.object({
  treatment_id: z.string().min(1, "시술을 선택해주세요."),
  region: z.string().min(1, "지역을 선택해주세요."),
  name: z.string().min(1, "이름을 입력해주세요."),
  gender: z.string({
    required_error: "성별을 선택해주세요.",
  }),
  birthdate: z.date({ required_error: "생년월일을 선택해주세요." }),
  residence: z.string().min(1, "주소를 선택해주세요."),
  concern: z
    .string()
    .max(
      QUOTATION_MAX_TEXT,
      `최대 ${QUOTATION_MAX_TEXT}자까지 입력할 수 있습니다.`
    )
    .optional(),
  images: z.any().optional(),
});

export type QuotationFormValues = z.infer<typeof quotationSchema>;
