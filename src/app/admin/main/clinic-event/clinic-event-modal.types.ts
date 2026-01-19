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
    amount: z.string({ required_error: "필수항목입니다" }),
    thumbnail_image: z.any(),
    main_image: z.any(),
  })
  .refine(
    (values) =>
      typeof values.thumbnail_image === "string" ||
      values.thumbnail_image instanceof File ||
      values.thumbnail_image === undefined ||
      values.thumbnail_image === null ||
      (Array.isArray(values.thumbnail_image) && values.thumbnail_image.length === 0),
    {
      message: "필수항목입니다",
      path: ["thumbnail_image"],
    }
  )
  .refine(
    (values) =>
      !values.thumbnail_image ||
      typeof values.thumbnail_image === "string" ||
      (values.thumbnail_image instanceof File && values.thumbnail_image.type.startsWith("image/")),
    {
      message: "File must be an image",
      path: ["thumbnail_image"],
    }
  )
  .refine(
    (values) =>
      typeof values.main_image === "string" ||
      values.main_image instanceof File ||
      values.main_image === undefined ||
      values.main_image === null ||
      (Array.isArray(values.main_image) && values.main_image.length === 0),
    {
      message: "필수항목입니다",
      path: ["main_image"],
    }
  )
  .refine(
    (values) =>
      !values.main_image ||
      typeof values.main_image === "string" ||
      (values.main_image instanceof File && values.main_image.type.startsWith("image/")),
    {
      message: "File must be an image",
      path: ["main_image"],
    }
  );
