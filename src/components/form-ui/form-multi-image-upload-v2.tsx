/**
 * FormMultiImageUploadV2 Component Usage Instructions
 * ==================================================
 *
 * This component provides a standardized multi-image upload interface that works with React Hook Form.
 * It handles both new file uploads and existing images from the database.
 *
 * EXPECTED DATA FORMAT:
 * The component expects the form field value to be an object with:
 * {
 *   files: File[],      // Array of File objects for new uploads
 *   previews: string[]  // Array of URLs (data URLs or Supabase URLs)
 * }
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. Form Schema (Zod):
 * ```typescript
 * const formSchema = z.object({
 *   images: z.object({
 *     files: z.array(z.instanceof(File)).optional(),
 *     previews: z.array(z.string()).optional(),
 *   }).optional(),
 * });
 * ```
 *
 * 2. Form Default Values:
 * ```typescript
 * const form = useForm({
 *   defaultValues: {
 *     images: {
 *       files: [],
 *       previews: existingImageUrls, // e.g., ["https://...", "https://..."]
 *     },
 *   },
 * });
 * ```
 *
 * 3. Component Usage:
 * ```tsx
 * <FormMultiImageUploadV2
 *   control={form.control}
 *   name="images"
 *   label="사진 첨부"
 *   maxImages={5}
 * />
 * ```
 *
 * 4. Form Submission:
 * ```typescript
 * const onSubmit = (values) => {
 *   const { files, previews } = values.images || { files: [], previews: [] };
 *
 *   // Convert to backend format if needed
 *   const allImages = [...(files || []), ...(previews || [])];
 *
 *   // Handle file uploads and existing URLs
 *   // Files need to be uploaded to storage
 *   // Previews are already URLs (existing images)
 * };
 * ```
 *
 * FEATURES:
 * - Supports existing images (shows as "old" status)
 * - Supports new file uploads (shows as "new" status)
 * - Soft delete for existing images (marks as "deleted" but keeps in array)
 * - Hard delete for new images (removes from array)
 * - Image preview with remove buttons
 * - File validation and limits
 * - Toast notifications for errors
 *
 * IMAGE STATUS TRACKING:
 * - "old": Existing images from database
 * - "new": Newly uploaded files
 * - "deleted": Existing images marked for deletion
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

/**
 * FormMultiImageUploadV2 - A standardized multi-image upload component for React Hook Form
 *
 * Always expects an object with files and previews arrays, and supports old/new/deleted status tracking.
 * Use this component when you need to handle both existing images and new file uploads.
 *
 * @param control - React Hook Form control object
 * @param name - Field name in the form (should match schema)
 * @param label - Display label for the upload section
 * @param maxImages - Maximum number of images allowed (default: 5)
 * @param formItemClassName - Optional CSS class for the form item wrapper
 * @param formLabelClassName - Optional CSS class for the form label
 */
export default function FormMultiImageUploadV2<T extends FieldValues>({
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
        // Always expect field.value to be an object with files and previews
        const value = field.value || { files: [], previews: [] };
        // Map to internal image array for UI
        const images: ImageFieldItem[] = [];
        // Support old images (previews with no file)
        (value.previews || []).forEach((url: string, idx: number) => {
          if (value.files && value.files[idx]) {
            images.push({ url, file: value.files[idx], status: "new" });
          } else {
            images.push({ url, status: "old" });
          }
        });
        // If there are more files than previews (shouldn't happen, but for safety)
        if (value.files && value.files.length > (value.previews?.length || 0)) {
          for (
            let i = value.previews?.length || 0;
            i < value.files.length;
            i++
          ) {
            images.push({ url: "", file: value.files[i], status: "new" });
          }
        }
        const setValue = (newImages: ImageFieldItem[]) => {
          // Keep all images, including those marked as deleted (for backend processing)
          field.onChange({
            files: newImages
              .filter((img) => img.status === "new")
              .map((img) => img.file)
              .filter(Boolean),
            previews: newImages
              .filter((img) => img.status !== "deleted")
              .map((img) => img.url),
          });
        };
        const handleRemoveImage = (idx: number) => {
          const img = images[idx];
          if (img.status === "old") {
            // Mark as deleted, keep in array
            const updated = images.map((item, i) =>
              i === idx ? { ...item, status: "deleted" as const } : item
            );
            setValue(updated);
          } else {
            // Remove new images from array
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
