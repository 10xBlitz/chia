"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { createReview } from "@/lib/supabase/services/reviews.services";
import { getPaginatedClinicTreatments } from "@/lib/supabase/services/treatments.services";
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
import HeaderWithBackButton from "@/components/header-with-back-button";
import FormMultiImageUpload from "@/components/form-ui/form-multi-image-upload";
import FormTextarea from "@/components/form-ui/form-textarea";
import FormStarRating from "@/components/form-ui/form-star-rating";

const MAX_IMAGES = 10;
const MAX_TEXT = 500;

const reviewSchema = z.object({
  clinic_treatment_id: z.string().min(1, "시술을 선택해주세요."),
  rating: z.number().min(1, "평점을 입력해주세요.").max(5),
  review: z
    .string()
    .max(MAX_TEXT, `최대 ${MAX_TEXT}자까지 입력할 수 있습니다.`),
  images: z.array(
    z.object({
      status: z.enum(["old", "new", "deleted", "updated"]),
      file: z.union([z.string(), z.instanceof(File)]),
      oldUrl: z.string().optional(),
    })
  ),
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

  const mutation = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      if (!user_id) throw new Error("로그인이 필요합니다.");
      return createReview({
        rating: values.rating,
        review: values.review,
        clinic_treatment_id: values.clinic_treatment_id,
        user_id,
        images: values.images,
      });
    },
    onSuccess: () => {
      toast.success("리뷰가 등록되었습니다."); // Review has been successfully registered.
      queryClient.invalidateQueries({ queryKey: ["reviews", user?.id] });
      router.back();
    },
    onError: (err) => {
      console.log(err);
      toast.error(err?.message || "리뷰 등록에 실패했습니다."); // Review registration failed.
    },
  });

  const onSubmit = (values: ReviewFormValues) => {
    console.log("Submitting review:", values);
    mutation.mutate(values);
  };

  return (
    <>
      <HeaderWithBackButton title="" />
      <Form {...form}>
        <form
          className="flex flex-col px-4 gap-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {/* Treatment chips */}
          <FormField
            control={form.control}
            name="clinic_treatment_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>시술</FormLabel>
                <FormControl>
                  <div className="flex gap-2 flex-wrap">
                    {treatmentsLoading && (
                      <span className="text-gray-400 text-sm">
                        로딩중... {/** Loading... */}
                      </span>
                    )}
                    {treatmentsError && (
                      <span className="text-red-400 text-sm">
                        시술 정보를 불러올 수 없습니다.{" "}
                        {/** Unable to retrieve procedure information.  */}
                      </span>
                    )}
                    {treatmentsData &&
                      treatmentsData.map((t) => (
                        <Button
                          key={t.id}
                          type="button"
                          variant={field.value === t.id ? "default" : "outline"}
                          className={`rounded-full px-4 py-1 text-sm ${
                            field.value === t.id ? " text-white" : ""
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
          <FormMultiImageUpload
            control={form.control}
            name="images"
            label="사진 첨부 (선택)"
            maxImages={MAX_IMAGES}
          />
          <FormStarRating
            control={form.control}
            name="rating"
            label="평점" // Rating
          />
          <FormTextarea
            control={form.control}
            name="review"
            label="리뷰"
            maxLength={MAX_TEXT}
            placeholder="리뷰를 입력해주세요. (최대 500자)" // Please enter your review (max 500 chars)
          />
          {/* Submit button */}
          <div className="px-4 py-4">
            <Button
              type="submit"
              className="w-full text-white"
              disabled={mutation.status === "pending"}
            >
              {mutation.status === "pending" ? "작성중..." : "작성하기"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
