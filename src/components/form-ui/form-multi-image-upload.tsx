/**
 * FormMultiImageUpload - A reusable multi-image upload form field component for React Hook Form.
 *
 * @example
 * // In your form component:
 * import { useForm } from "react-hook-form";
 * import { Form } from "../ui/form";
 * import FormMultiImageUpload from "@/components/form-ui/form-multi-image-upload";
 *
 * // --- Zod Schema Example ---
 * import { z } from "zod";
 * export const formSchema = z.object({
 *   // ...other fields...
 *   images: z.object({
 *     files: z.array(z.any()), // or z.instanceof(File)
 *     previews: z.array(z.string()),
 *   }),
 * });
 * export type FormValues = z.infer<typeof formSchema>;
 *
 * // --- Usage Example ---
 * const form = useForm<FormValues>({ ... });
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <FormMultiImageUpload
 *         control={form.control}
 *         name="images"
 *         maxImages={5}
 *       />
 *       // ...other fields and submit button...
 *     </form>
 *   </Form>
 * );
 *
 * @see {@link src/app/patient/quotation/create-quotation/page.tsx} for a full usage example
 *
 * @param control - The react-hook-form control object
 * @param name - The field name (string)
 * @param maxImages - Maximum number of images allowed
 * @param formItemClassName - Custom class for the FormItem
 * @param formLabelClassName - Custom class for the FormLabel
 */

import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { toast } from "react-hot-toast";

type ImageFieldItem = {
  url: string; // data URL or Supabase URL
  file?: File; // Only for new images
  status: "old" | "new" | "deleted";
};

type FormImageUploadProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>; // e.g. "images"
  label?: string;
  maxImages?: number;
  formItemClassName?: string;
  formLabelClassName?: string;
};

export default function FormMultiImageUpload<T extends FieldValues>({
  control,
  name,
  label = "사진 첨부 (선택)",
  maxImages = 5,
  formItemClassName,
  formLabelClassName,
}: FormImageUploadProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const images: ImageFieldItem[] = field.value || [];
        const setValue = (newImages: ImageFieldItem[]) => {
          field.onChange(newImages);
        };
        const handleRemoveImage = (idx: number) => {
          const img = images[idx];
          if (img.status === "old") {
            // Mark as deleted
            setValue(
              images.map((item, i) =>
                i === idx ? { ...item, status: "deleted" } : item
              )
            );
          } else if (img.status === "new") {
            // Remove from array
            setValue(images.filter((_, i) => i !== idx));
          }
        };
        // Only show images not deleted
        const visibleImages = images.filter((img) => img.status !== "deleted");
        return (
          <FormItem className={formItemClassName}>
            <FormLabel
              className={cn(
                "text-[16px] font-pretendard-600",
                formLabelClassName
              )}
            >
              {label}
            </FormLabel>
            <FormControl>
              <div className="flex gap-2 flex-wrap mt-2">
                {visibleImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-lg overflow-hidden"
                  >
                    <Image src={img.url} alt={`quotation-img-${idx}`} fill />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute top-1 right-1 bg-white/80 rounded-full"
                      onClick={() =>
                        handleRemoveImage(images.findIndex((i) => i === img))
                      }
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
                {visibleImages.length < maxImages && (
                  <div className="w-20 h-20 flex items-center justify-center border rounded-lg bg-gray-100 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full h-full flex flex-col items-center justify-center"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="text-2xl">+</span>
                      <span className="text-xs mt-1">사진 추가</span>
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      max={maxImages}
                      onChange={(e) => {
                        const inputFiles = e.target.files;
                        if (!inputFiles) return;
                        const allowed = maxImages - visibleImages.length;
                        if (inputFiles.length > allowed) {
                          toast.error(
                            `최대 ${maxImages}장까지 업로드할 수 있습니다.`
                          );
                        }
                        const fileArr = Array.from(inputFiles).slice(
                          0,
                          allowed
                        );
                        let loaded = 0;
                        const newImages: ImageFieldItem[] = [];
                        fileArr.forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            newImages.push({
                              url: ev.target?.result as string,
                              file,
                              status: "new",
                            });
                            loaded++;
                            if (loaded === fileArr.length) {
                              setValue([...images, ...newImages]);
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                        if (fileArr.length === 0) {
                          setValue([...images]);
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
