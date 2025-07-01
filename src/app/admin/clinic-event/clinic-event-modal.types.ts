import { z } from "zod";

export const clinicEventFormSchema = z
  .object({
    id: z.string().optional(),
    clinic_id: z.string({ required_error: "필수항목입니다" }),
    title: z.string({ required_error: "필수항목입니다" }),
    description: z.string().optional(),
    date_range: z.object(
      { from: z.date(), to: z.date() },
      { required_error: "필수항목입니다" }
    ),
    clinic_treatment_id: z
      .string({
        required_error: "필수항목입니다",
      })
      .min(1, "필수항목입니다"),
    discount: z.string({ required_error: "필수항목입니다" }),
    image: z.any(),
  })
  .refine(
    (values) =>
      typeof values.image === "string" ||
      values.image instanceof File ||
      values.image === undefined ||
      values.image === null ||
      (Array.isArray(values.image) && values.image.length === 0),
    {
      message: "필수항목입니다",
      path: ["image"],
    }
  )
  .refine(
    (values) =>
      !values.image ||
      typeof values.image === "string" ||
      (values.image instanceof File && values.image.type.startsWith("image/")),
    {
      message: "File must be an image",
      path: ["image"],
    }
  );
