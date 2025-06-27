"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  insertBanner,
  updateBanner,
} from "@/lib/supabase/services/banner.services";
import FormInput from "@/components/form-ui/form-input";
import { BannerTable } from "./columns";
import FormSelect from "@/components/form-ui/form-select";
import { SelectItem } from "@/components/ui/select";
import Image from "next/image";
import type { Control } from "react-hook-form";
import {
  uploadFileToSupabase,
  deleteFileFromSupabase,
  BANNER_IMAGE_BUCKET,
} from "@/lib/supabase/services/upload-file.services";
import { getPaginatedClinics } from "@/lib/supabase/services/clinics.services";

const bannerFormSchema = z.object({
  id: z.string().optional(),
  banner_type: z.enum(["main", "sub"]),
  title: z.string().optional(),
  image: z.string(),
  clinic_id: z.string().min(1, "병원을 선택해주세요"), // Please select a hospital
});

type BannerFormValues = z.infer<typeof bannerFormSchema>;

// Inline image upload component for banner images
type BannerImageUploadProps = {
  control: Control<BannerFormValues>;
  name: keyof BannerFormValues;
  label: string;
  accept?: string;
  disabled?: boolean;
  description?: string;
};

function BannerImageUpload({
  control,
  name,
  label,
  accept = "image/*",
  disabled,
  description,
  setFile,
  preview,
  setPreview,
}: BannerImageUploadProps & {
  file: File | null;
  setFile: (file: File | null) => void;
  preview: string | null;
  setPreview: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="flex flex-col gap-2">
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                disabled={disabled}
                className="hidden"
                onChange={async (e) => {
                  setError("");
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setFile(file);
                  // Show preview
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setPreview(ev.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current && inputRef.current.click()}
                disabled={disabled}
              >
                이미지 선택 {/* Select Image */}
              </Button>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {(preview || field.value) && (
                <div className="mt-2 items-center flex justify-center">
                  <Image
                    src={preview || field.value?.trimEnd() || ""}
                    alt="배너 미리보기" // Banner preview
                    width={200}
                    height={80}
                    className="rounded border object-contain bg-white"
                  />
                </div>
              )}
              {error && <FormMessage>{error}</FormMessage>}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function BannerModal({
  data,
  open,
  onClose,
  onSuccess,
}: {
  data?: BannerTable;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: data
      ? {
          id: data.id,
          banner_type: data.banner_type,
          title: data.title || "",
          image: data.image || "",
          clinic_id: data.clinic_id || "",
        }
      : {
          banner_type: "main",
          title: "",
          image: "",
          clinic_id: "",
        },
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch clinics for dropdown (first 100, sorted by name)
  const { data: clinicsPage, isLoading: clinicsLoading } = useQuery({
    queryKey: ["paginated-clinics-dropdown"],
    queryFn: () => getPaginatedClinics(1, 100),
  });
  const clinics = clinicsPage?.data || [];

  const mutation = useMutation({
    mutationFn: async (values: BannerFormValues) => {
      let imageUrl = values.image;
      // If a new file is selected
      if (file) {
        setUploading(true);
        try {
          // If editing and there is an old image, delete it first
          if (data?.image) {
            try {
              await deleteFileFromSupabase(data.image, {
                bucket: BANNER_IMAGE_BUCKET,
              });
            } catch (delErr) {
              // Ignore delete error, but log for debugging
              console.warn("Failed to delete old image:", delErr);
            }
          }
          imageUrl = await uploadFileToSupabase(file, {
            bucket: BANNER_IMAGE_BUCKET,
            allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
            maxSizeMB: 10,
          });
        } finally {
          setUploading(false);
        }
      }
      if (data?.id) {
        await updateBanner(data.id, {
          ...values,
          image: imageUrl,
          clinic_id: values.clinic_id,
        });
      } else {
        await insertBanner({
          ...values,
          image: imageUrl,
          clinic_id: values.clinic_id,
        });
      }
    },
    onSuccess: () => {
      toast.success("배너가 저장되었습니다."); // Banner saved
      onSuccess();
      onClose();
      setFile(null);
      setPreview(null);
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || "저장 실패");
      } else {
        toast.error("저장 실패");
      }
    },
  });

  const handleClose = () => {
    onClose();
    setFile(null);
    setPreview(null);
    form.reset();
  };
  return (
    <Modal
      description="배너 추가 또는 수정" // Add or edit banner
      isOpen={open}
      onClose={handleClose}
      title={data ? "배너 수정" : "배너 추가"}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <FormSelect
            control={form.control}
            name="banner_type"
            label="배너 유형" // Banner Type
            placeholder="배너 유형을 선택하세요" // Select banner type
          >
            <SelectItem
              value="main"
              className="cursor-pointer hover:bg-gray-100"
            >
              메인
            </SelectItem>
            <SelectItem
              value="sub"
              className="cursor-pointer hover:bg-gray-100"
            >
              서브
            </SelectItem>
          </FormSelect>

          <FormSelect
            control={form.control}
            name="clinic_id"
            label="병원" // Hospital
            placeholder="병원을 선택해주세요" // Please select a clinic
            disabled={clinicsLoading}
            loading={clinicsLoading}
          >
            {clinics.length ? (
              clinics.map((clinic: { id: string; clinic_name: string }) => (
                <SelectItem
                  key={clinic.id}
                  value={clinic.id}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  {clinic.clinic_name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>
                {clinicsLoading ? "로딩 중..." : "병원 없음"}{" "}
                {/* Loading... / No clinics */}
              </SelectItem>
            )}
          </FormSelect>

          <FormInput
            control={form.control}
            name="title"
            label="제목" // Title
            placeholder="제목을 입력하세요" // Enter title
          />
          <BannerImageUpload
            control={form.control}
            name="image"
            label="이미지 업로드" // Image Upload
            accept="image/*"
            disabled={mutation.isPending || uploading}
            description="배너 이미지를 업로드하세요." // Upload banner image
            file={file}
            setFile={setFile}
            preview={preview}
            setPreview={setPreview}
          />
          <div className="flex flex-col gap-2 mt-10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending || uploading}
              className="w-full"
            >
              취소 {/* Cancel */}
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || uploading}
              className="w-full"
            >
              {uploading ? "업로드 중..." : "저장"} {/* Uploading... / Save */}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
