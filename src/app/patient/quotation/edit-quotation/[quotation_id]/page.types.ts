import { z } from "zod";

export const quotationEditSchema = z.object({
  treatmentId: z.string().optional(),
  region: z.string().min(1, "지역을 입력하세요."), // Please enter a region.
  name: z.string().min(1, "이름을 입력하세요."), // Please enter a name.
  gender: z.string().min(1, "성별을 선택하세요."), // Please select a gender.
  birthdate: z.date({ required_error: "생년월일을 선택하세요." }), // Please select a birthdate.
  residence: z.string().min(1, "주소를 입력하세요."), // Please enter an address.
  concern: z.string().max(500, "500자 이내로 입력하세요.").optional(), // Up to 500 chars
  images: z.array(
    z.object({
      url: z.string(),
      file: z.any().optional(),
      status: z.enum(["old", "new", "deleted"]),
    })
  ),
});

export type QuotationEditImage = z.infer<
  typeof quotationEditSchema.shape.images.element
>;
export type QuotationEditFormValues = z.infer<typeof quotationEditSchema>;
