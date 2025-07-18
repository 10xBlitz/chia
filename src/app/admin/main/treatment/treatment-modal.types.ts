import { z } from "zod";

export const treatmentModalFormSchema = z
  .object({
    id: z.string().optional(),
    treatment_name: z.string().min(1, "필수항목입니다"),
    image_url: z.any(),
  })
  .refine(
    (values) =>
      typeof values.image_url === "string" ||
      values.image_url instanceof File ||
      values.image_url === undefined ||
      values.image_url === null ||
      (Array.isArray(values.image_url) && values.image_url.length === 0),
    {
      message: "필수항목입니다",
      path: ["image_url"],
    }
  )
  .refine(
    (values) =>
      !values.image_url ||
      typeof values.image_url === "string" ||
      (values.image_url instanceof File &&
        values.image_url.type.startsWith("image/")),
    {
      message: "File must be an image",
      path: ["image_url"],
    }
  );
