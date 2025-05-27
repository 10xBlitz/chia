"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { X } from "lucide-react";
import { useUserStore } from "@/providers/user-store-provider";
import BackButton from "@/components/back-button";
import AddressSelector from "@/components/address-selector";
import GenderSelector from "@/components/gender-selector";
import { KoreanDatePicker } from "@/components/date-picker-v2";
import { getPaginatedClinicTreatments } from "@/lib/supabase/services/treatments.services";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createQuotation } from "@/lib/supabase/services/quotation.services";

const MAX_IMAGES = 5;
const MAX_TEXT = 500;

// --- Form Schema ---
const quotationSchema = z.object({
  clinic_treatment_id: z.string().min(1, "시술을 선택해주세요."),
  region: z.string().min(1, "지역을 선택해주세요."),
  name: z.string().min(1, "이름을 입력해주세요."),
  gender: z.string({
    required_error: "성별을 선택해주세요.",
  }),
  birthdate: z.date({ required_error: "생년월일을 선택해주세요." }),
  residence: z.string().min(1, "주소를 선택해주세요."),
  concern: z
    .string()
    .max(MAX_TEXT, `최대 ${MAX_TEXT}자까지 입력할 수 있습니다.`)
    .optional(),
  images: z.any().optional(),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

export default function CreateQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinic_id = searchParams.get("clinic_id") || "";
  const user = useUserStore((state) => state.user);
  const [uploadingImageIdx, setUploadingImageIdx] = useState<number | null>(
    null
  );

  // Treatments fetch
  const {
    data: treatmentsData,
    isLoading: treatmentsLoading,
    error: treatmentsError,
  } = useQuery({
    queryKey: ["clinic-treatments", clinic_id],
    queryFn: async () => {
      if (!clinic_id) return [];
      const res = await getPaginatedClinicTreatments(clinic_id, 1, 100);
      return res.data || [];
    },
    enabled: !!clinic_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // 1 minute
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      clinic_treatment_id: "",
      region: "",
      name: "",
      gender: "",
      birthdate: new Date(),
      residence: "",
      concern: "",
      images: [],
    },
  });

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: async (values: QuotationFormValues) => {
      if (!user?.id) throw new Error("로그인이 필요합니다.");
      if (!clinic_id) throw new Error("치과 정보가 없습니다.");
      return createQuotation({
        ...values,
        user_id: user.id,
        clinic_id,
        images,
        setUploadingImageIdx, // pass the setter
      });
    },
    onSuccess: () => {
      setUploadingImageIdx(null); // reset after upload
      toast.success("견적 요청이 등록되었습니다.");
      queryClient.invalidateQueries();
      router.back();
    },
    onError: (err) => {
      setUploadingImageIdx(null); // reset on error
      console.log("Error creating quotation:", err);
      toast.error(
        err?.message || "견적 등록에 실패했습니다. something went wrong"
      );
    },
  });

  const onSubmit = (values: QuotationFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form
        className="max-w-[460px] mx-auto min-h-screen flex flex-col bg-white"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {/* Header */}
        <div className="flex items-center px-4 pt-4 pb-2">
          <BackButton />
        </div>
        {/* Treatment dropdown */}
        <div className="px-4 mt-2">
          {treatmentsLoading ? (
            <div>로딩 중... {/**loading */}</div>
          ) : (
            <FormField
              control={form.control}
              name="clinic_treatment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시술 {/* Treatment */}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={treatmentsLoading || !!treatmentsError}
                    >
                      <SelectTrigger className="w-full min-h-[45px]">
                        <SelectValue
                          placeholder="시술을 선택해주세요" /* Please select a treatment */
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentsData &&
                          treatmentsData.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {
                                t.treatment?.treatment_name ||
                                  "시술" /* Treatment */
                              }
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        {/* Fill in for myself */}
        <div className="px-4 mt-4 flex gap-3">
          <Checkbox
            onCheckedChange={(e) => {
              if (e && user) {
                form.setValue("name", user.full_name || "");
                form.setValue("gender", user.gender || "male");
                form.setValue("birthdate", new Date(user.birthdate || ""));
                form.setValue("residence", user.residence);
                form.setValue("region", user.residence || "");
              }

              if (!e) {
                form.setValue("name", "");
                form.setValue("gender", "");
                form.setValue("birthdate", new Date());
                form.setValue("residence", "");
                form.setValue("region", "");
              }
            }}
          />

          <FormLabel className="mb-0">
            나 자신을 대신해 주세요 {/* Fill in for myself */}
          </FormLabel>
        </div>
        {/* Region dropdown */}
        <div className="px-4 mt-4">
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => {
              // Split city/region every render to ensure AddressSelector updates
              const [city, region] =
                field.value && field.value.includes(",")
                  ? field.value.split(",")
                  : ["", ""];
              return (
                <FormItem>
                  <FormLabel>지역 {/* Region */}</FormLabel>
                  <FormControl>
                    <AddressSelector
                      key={city + region} // Force remount when city/region changes
                      onAddressSelect={(_city, _region) =>
                        field.onChange(`${_city},${_region}`)
                      }
                      initialRegion={region}
                      initialCity={city}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
        {/* Name */}
        <div className="px-4 mt-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름 {/* Name */}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="min-h-[45px]"
                    placeholder="이름을 입력해주세요" /* Please enter your name */
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Gender */}
        <div className="px-4 mt-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>성별 {/* Gender */}</FormLabel>
                <FormControl>
                  <GenderSelector
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Birthdate */}
        <div className="px-4 mt-4">
          <FormField
            control={form.control}
            name="birthdate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>생년월일 {/* Birthdate */}</FormLabel>
                <FormControl>
                  <KoreanDatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => field.onChange(date ? date : "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Residence */}
        <div className="px-4 mt-4">
          <FormField
            control={form.control}
            name="residence"
            render={({ field }) => {
              // Split city/region every render to ensure AddressSelector updates
              const [city, region] =
                field.value && field.value.includes(",")
                  ? field.value.split(",")
                  : ["", ""];
              return (
                <FormItem>
                  <FormLabel>주소 {/* Address */}</FormLabel>
                  <FormControl>
                    <AddressSelector
                      key={city + region} // Force remount when city/region changes
                      onAddressSelect={(city, region) =>
                        field.onChange(`${city},${region}`)
                      }
                      initialCity={city}
                      initialRegion={region}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
        {/* Concern */}
        <div className="px-4 mt-4">
          <FormField
            control={form.control}
            name="concern"
            render={({ field }) => (
              <FormItem>
                <FormLabel>고민/요청사항 {/* Concern/Request */}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={5}
                    placeholder="고민이나 요청사항을 입력해주세요." /* Please enter your concern or request */
                    className="resize-none"
                    maxLength={MAX_TEXT}
                  />
                </FormControl>
                <div className="text-right text-xs text-gray-400 mt-1">
                  {field.value?.length || 0}/{MAX_TEXT}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Image upload */}
        <div className="px-4 mt-4">
          <FormLabel>
            사진 첨부 (선택) {/* Photo attachment (optional) */}
          </FormLabel>
          <div className="flex gap-2 flex-wrap mt-2">
            {imagePreviews.map((src, idx) => (
              <div
                key={idx}
                className="relative w-20 h-20 rounded-lg overflow-hidden"
              >
                <Image src={src} alt={`quotation-img-${idx}`} fill />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 bg-white/80 rounded-full"
                  onClick={() => handleRemoveImage(idx)}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <div className="w-20 h-20 flex items-center justify-center border rounded-lg bg-gray-100 relative">
                <Button
                  type="button"
                  typeof="button"
                  variant="ghost"
                  className="w-full h-full flex flex-col items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="text-2xl">+</span>
                  <span className="text-xs mt-1">
                    사진 추가 {/* Add photo */}
                  </span>
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  max={MAX_IMAGES}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    const allowed = MAX_IMAGES - images.length;
                    if (files.length > allowed) {
                      toast.error(
                        `최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.` // You can upload up to {MAX_IMAGES} images.
                      );
                    }
                    const fileArr = Array.from(files).slice(0, allowed);
                    setImages((prev) => [...prev, ...fileArr]);
                    fileArr.forEach((file) => {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setImagePreviews((prev) => [
                          ...prev,
                          ev.target?.result as string,
                        ]);
                      };
                      reader.readAsDataURL(file);
                    });
                    e.target.value = "";
                  }}
                />
              </div>
            )}
          </div>
        </div>
        {/* Submit button */}
        <div className="px-4 py-4 mt-auto">
          <Button
            type="submit"
            className="w-full btn-primary text-white"
            disabled={mutation.status === "pending"}
          >
            {
              typeof uploadingImageIdx === "number" ? (
                <div className="  font-medium flex flex-col">
                  <span> 제출 중... {/**Submitting... */}</span>
                  <span className="text-sm">
                    {" "}
                    이미지 {/**Image */} {uploadingImageIdx + 1} 업로드 중...{" "}
                    {/**Uploading */}
                  </span>
                </div>
              ) : (
                " 견적 요청하기"
              ) /* Request Quotation */
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
