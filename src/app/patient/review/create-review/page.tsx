"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { createReview } from "@/lib/supabase/services/reviews.services";
import { getPaginatedClinicTreatments } from "@/lib/supabase/services/treatments.services";
import { Star, ChevronLeft, X } from "lucide-react";
import Image from "next/image";
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
import { useUserStore } from "@/providers/user-store-provider";

const MAX_IMAGES = 10;
const MAX_TEXT = 500;

const reviewSchema = z.object({
  clinic_treatment_id: z.string().min(1, "시술을 선택해주세요."),
  rating: z.number().min(1, "평점을 입력해주세요.").max(5),
  review: z
    .string()
    .max(MAX_TEXT, `최대 ${MAX_TEXT}자까지 입력할 수 있습니다.`),
  images: z.any().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function CreateReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinic_id = searchParams.get("clinic_id") || "";
  const user = useUserStore((state) => state.user);
  const user_id = user?.id || "";

  // Fetch clinic treatments
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
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      clinic_treatment_id: "",
      rating: 4,
      review: "",
      images: [],
    },
  });

  // Remove image
  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      if (!user_id) throw new Error("로그인이 필요합니다.");
      return createReview({
        rating: values.rating,
        review: values.review,
        clinic_treatment_id: values.clinic_treatment_id,
        user_id,
        images,
      });
    },
    onSuccess: () => {
      toast.success("리뷰가 등록되었습니다.");
      queryClient.invalidateQueries();
      router.back();
    },
    onError: (err) => {
      console.log(err);
      toast.error(err?.message || "리뷰 등록에 실패했습니다.");
    },
  });

  const onSubmit = (values: ReviewFormValues) => {
    console.log("Submitting review:", values);
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
          <Button
            variant="ghost"
            size="icon"
            className="min-h-6 min-w-6"
            type="button"
            onClick={() => router.back()}
          >
            <ChevronLeft className="min-h-6 min-w-6" />
          </Button>
        </div>
        {/* Treatment chips */}
        <div className="px-4">
          <FormField
            control={form.control}
            name="clinic_treatment_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>시술</FormLabel>
                <FormControl>
                  <div className="flex gap-2 flex-wrap">
                    {treatmentsLoading && (
                      <span className="text-gray-400 text-sm">로딩중...</span>
                    )}
                    {treatmentsError && (
                      <span className="text-red-400 text-sm">
                        시술 정보를 불러올 수 없습니다.
                      </span>
                    )}
                    {treatmentsData &&
                      treatmentsData.map((t) => (
                        <Button
                          key={t.id}
                          type="button"
                          variant={
                            field.value === t.id ? "secondary" : "outline"
                          }
                          className={`rounded-full px-4 py-1 text-sm ${
                            field.value === t.id ? "bg-black text-white" : ""
                          }`}
                          onClick={() => field.onChange(t.id)}
                        >
                          {t.treatment?.treatment_name || "시술"}
                        </Button>
                      ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Image upload */}
        <div className="px-4 mt-6">
          <div className="flex gap-2 flex-wrap">
            {imagePreviews.map((src, idx) => (
              <div
                key={idx}
                className="relative w-20 h-20 rounded-lg overflow-hidden"
              >
                <Image
                  src={src}
                  alt={`review-img-${idx}`}
                  fill
                  className="object-cover"
                />
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
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    const allowed = MAX_IMAGES - images.length;
                    if (files.length > allowed) {
                      toast.error(
                        `최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`
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
        {/* Rating */}
        <div className="px-4 mt-6">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>평점</FormLabel>
                <FormControl>
                  <div className="flex items-center ml-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="p-0"
                        onClick={() => field.onChange(n)}
                        aria-label={`${n}점`}
                      >
                        <Star
                          size={24}
                          className={
                            n <= field.value
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }
                          fill={n <= field.value ? "currentColor" : "none"}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Review textarea */}
        <div className="px-4 mt-6 flex-1">
          <FormField
            control={form.control}
            name="review"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={5}
                    placeholder="리뷰를 입력해주세요."
                    className="resize-none"
                    maxLength={MAX_TEXT}
                  />
                </FormControl>
                <div className="text-right text-xs text-gray-400 mt-1">
                  {field.value.length}/{MAX_TEXT}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Submit button */}
        <div className="px-4 py-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 text-white"
            disabled={mutation.status === "pending"}
          >
            {mutation.status === "pending" ? "작성중..." : "작성하기"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
