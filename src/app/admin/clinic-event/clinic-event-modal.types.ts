import { z } from "zod";

export const clinicEventFormSchema = z
  .object({
    id: z.string().optional(),
    clinic_id: z.string({ required_error: "Clinic ID is required" }),
    title: z.string({ required_error: "Title is required" }),
    description: z.string().optional(),
    date_range: z.object(
      { from: z.date(), to: z.date() },
      { required_error: "Date range is required" }
    ),
    clinic_treatment_id: z.string({
      required_error: "Treatment is required",
    }),
    discount: z.string({ required_error: "Discount is required" }),
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
      message: "Image is required",
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
