/**
 * FormMultiImageUploadV3 Component Usage Instructions
 * ==================================================
 *
 * This component provides a standardized multi-image upload interface that works with React Hook Form.
 * It handles both new file uploads and existing images from the database.
 *
 * EXPECTED DATA FORMAT:
 * The component expects the form field value to be an array of objects with:
 * {
 *   status: "old" | "new" | "deleted" | "updated", // Status of the image
 *   file: string | File, // Supabase URL string for existing images, File object for new uploads
 * }
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. Form Schema (Zod):
 * ```typescript
 * const formSchema = z.object({
 *   images: z.array(
 *     z.object({
 *       status: z.enum(["old", "new", "deleted", "updated"]),
 *       file: z.union([z.string().url(), z.instanceof(File)]),
 *     })
 *   ).optional(),
 * });
 * ```
 *
 * 2. Form Default Values:
 * ```typescript
 * const form = useForm({
 *   defaultValues: {
 *     images: [
 *       { status: "old", file: "https://..." },
 *       { status: "new", file: new File([""], "filename.jpg") },
 *     ],
 *   },
 * });
 * ```
 *
 * 3. Component Usage:
 * ```tsx
 * <FormMultiImageUploadV3
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
 *   // values.images is already in the expected format
 *   // Handle file uploads and existing URLs based on status
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
 * - "updated": Existing images updated with a new file
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

// New schema type for each image
export type ImageFieldItem = {
  status: "old" | "new" | "deleted" | "updated";
  file: string | File; // string for existing (Supabase URL), File for new/updated
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
 * FormMultiImageUploadV3 - Multi-image upload with status tracking (old/new/updated/deleted)
 *
 * @param control - React Hook Form control object
 * @param name - Field name in the form (should match schema)
 * @param label - Display label for the upload section
 * @param maxImages - Maximum number of images allowed (default: 5)
 * @param formItemClassName - Optional CSS class for the form item wrapper
 * @param formLabelClassName - Optional CSS class for the form label
 */
export default function FormMultiImageUploadV3<T extends FieldValues>({
  control,
  name,
  label = "사진 첨부 (선택)", // Photo attachment (optional)
  maxImages = 5,
  formItemClassName,
  formLabelClassName,
}: FormImageUploadProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateInputRef = useRef<HTMLInputElement>(null);
  const updateIndexRef = useRef<number | null>(null);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Always expect field.value to be an array of ImageFieldItem
        const images: ImageFieldItem[] = field.value || [];
        // Only show images not deleted
        const visibleImages = images.filter((img) => img.status !== "deleted");
        // Helper to update the images array
        const setValue = (newImages: ImageFieldItem[]) => {
          field.onChange(newImages);
        };
        // Add new images
        const handleAddImages = (files: FileList | null) => {
          if (!files) return;
          const allowed = maxImages - visibleImages.length;
          if (files.length > allowed) {
            toast.error(`최대 ${maxImages}장까지 업로드할 수 있습니다.`); // You can upload up to {maxImages} images.
          }
          const fileArr = Array.from(files).slice(0, allowed);
          const newImages: ImageFieldItem[] = fileArr.map((file) => ({
            status: "new",
            file,
          }));
          setValue([...images, ...newImages]);
        };
        // Mark image as deleted
        const handleRemoveImage = (idx: number) => {
          const updated = images.map((img, i) =>
            i === idx ? { ...img, status: "deleted" as const } : img
          );
          setValue(updated);
        };
        // Update image (replace file, set status)
        const handleUpdateImage = (idx: number, file: File) => {
          const updated = images.map((img, i): ImageFieldItem => {
            if (i !== idx) return img;
            if (img.status === "old") {
              return { status: "updated", file };
            } else {
              return { status: "new", file };
            }
          });
          setValue(updated);
        };
        // When user clicks image, open update file input
        const onImageClick = (idx: number) => {
          updateIndexRef.current = idx;
          updateInputRef.current?.click();
        };
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
                    className="relative w-20 h-20 rounded-lg overflow-hidden group cursor-pointer"
                  >
                    {typeof img.file === "string" ? (
                      <Image
                        src={img.file}
                        alt={`quotation-img-${idx}`}
                        fill
                        onClick={() =>
                          onImageClick(images.findIndex((i) => i === img))
                        }
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src={URL.createObjectURL(img.file)}
                        alt={`quotation-img-${idx}`}
                        fill
                        unoptimized
                        onClick={() =>
                          onImageClick(images.findIndex((i) => i === img))
                        }
                        className="object-cover"
                      />
                    )}
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
                      <span className="text-xs mt-1">사진 추가</span>{" "}
                      {/* Add photo */}
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      max={maxImages}
                      onChange={(e) => {
                        handleAddImages(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}
                {/* Hidden input for updating image */}
                <Input
                  ref={updateInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const idx = updateIndexRef.current;
                    if (e.target.files && e.target.files[0] && idx !== null) {
                      handleUpdateImage(idx, e.target.files[0]);
                    }
                    updateIndexRef.current = null;
                    e.target.value = "";
                  }}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
