import { z } from "zod";

export const QUOTATION_MAX_IMAGES = 5;
export const QUOTATION_MAX_TEXT = 500;

// --- Form Schema ---
export const quotationSchema = z.object({
  treatment_id: z.string().optional(),
  region: z.string().min(1, "지역을 선택해주세요."), // Please select a region
  name: z.string().min(1, "이름을 입력해주세요."), // Please enter your name
  gender: z.string({
    required_error: "성별을 선택해주세요.", // Please select a gender
  }),
  birthdate: z.date({ required_error: "생년월일을 선택해주세요." }), // Please select a birthdate
  residence: z.string().min(1, "주소를 선택해주세요."), // Please select an address
  concern: z
    .string()
    .max(
      QUOTATION_MAX_TEXT,
      `최대 ${QUOTATION_MAX_TEXT}자까지 입력할 수 있습니다.` // You can enter up to {QUOTATION_MAX_TEXT} characters.
    )
    .optional(),
  images: z
    .object({
      files: z.array(z.any()), // or z.instanceof(File)
      previews: z.array(z.string()),
    })
    .optional(),
});

export type QuotationFormValues = z.infer<typeof quotationSchema>;
