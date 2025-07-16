"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { getPaginatedClinicTreatments } from "@/lib/supabase/services/treatments.services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserStore } from "@/providers/user-store-provider";
import HeaderWithBackButton from "@/components/header-with-back-button";
import {
  fetchReviewById,
  updateReview,
} from "@/lib/supabase/services/reviews.services";

import FormTextarea from "@/components/form-ui/form-textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FormStarRating from "@/components/form-ui/form-star-rating";
import FormMultiImageUploadV3 from "@/components/form-ui/form-multi-image-upload";
import EditReviewSkeleton from "./edit-review-skeleton";

// New type for image field

const MAX_IMAGES = 10;
const MAX_TEXT = 500;

const reviewSchema = z.object({
  clinic_treatment_id: z.string().min(1, "시술을 선택해주세요."), // Please select a treatment
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

export type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function EditReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("review_id") || "";
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();

  // Fetch review data
  const { data: reviewData, isLoading: reviewLoading } = useQuery({
    queryKey: ["review", reviewId],
    queryFn: () => fetchReviewById(reviewId),
    enabled: !!reviewId,
  });

  // Fetch clinic treatments
  const clinic_id = reviewData?.clinic_treatment?.clinic_id || "";
  const {
    data: treatmentsData,
    isLoading: treatmentsLoading,
    isError: treatmentsError,
  } = useQuery({
    queryKey: ["clinic-treatments", clinic_id],
    queryFn: async () => {
      const res = await getPaginatedClinicTreatments(clinic_id, 1, 100);
      return res.data;
    },
    enabled: !!clinic_id && !!reviewData,
  });

  // Initialize form with fetched review data

  console.log("Fetched review data:", reviewData);
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    values: reviewData
      ? {
          clinic_treatment_id: reviewData.clinic_treatment_id || "",
          rating: reviewData.rating || 4,
          review: reviewData.review || "",
          images: Array.isArray(reviewData.images)
            ? reviewData.images.map((url: string) => ({
                status: "old",
                file: url,
              }))
            : [],
        }
      : {
          clinic_treatment_id: "",
          rating: 4,
          review: "",
          images: [],
        },
  });

  const mutation = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      if (!user?.id) throw new Error("로그인이 필요합니다."); // Login required
      if (!reviewData) throw new Error("리뷰 정보를 불러올 수 없습니다."); // Review not loaded

      // 3. Save the combined array
      return updateReview({
        review_id: reviewId,
        rating: values.rating,
        review: values.review,
        clinic_treatment_id: values.clinic_treatment_id,
        images: values.images,
      });
    },
    onSuccess: () => {
      toast.success("리뷰가 수정되었습니다."); // Review updated successfully.

      //for the home page clinic-reviews and patient review page
      queryClient.invalidateQueries({ queryKey: ["clinic-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review", reviewId] });
      router.back();
    },
    onError: (err) => {
      console.log(err);
      toast.error(err?.message || "리뷰 수정에 실패했습니다."); // Failed to update review.
    },
  });

  const onSubmit = (values: ReviewFormValues) => {
    mutation.mutate(values);
  };

  if (reviewLoading) {
    return (
      <>
        <HeaderWithBackButton title="리뷰 수정" /> {/* Edit Review */}
        <EditReviewSkeleton />
      </>
    );
  }

  return (
    <>
      <HeaderWithBackButton title="리뷰 수정" />
      <Form {...form}>
        <form className="flex flex-col" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Treatment selection */}
          <div className="px-4">
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
                            variant={
                              field.value === t.id ? "default" : "outline"
                            }
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
          </div>
          {/* Image upload */}
          <div className="px-4 mt-6">
            <FormMultiImageUploadV3
              control={form.control}
              name="images"
              label="사진 첨부 (선택)" // Image upload (optional)
              maxImages={MAX_IMAGES}
            />
          </div>
          {/* Review text */}
          <div className="px-4 mt-6">
            <FormTextarea
              control={form.control}
              name="review"
              label="리뷰" // Review
              maxLength={MAX_TEXT}
              inputClassName="h-32"
              placeholder="리뷰를 입력해주세요. (최대 500자)" // Please enter your review (max 500 chars)
            />
          </div>
          {/* Rating */}
          <div className="px-4 mt-6">
            <FormStarRating
              control={form.control}
              name="rating"
              label="평점" // Rating
            />
          </div>
          {/* Submit button */}
          <div className="px-4 mt-8 mb-4">
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "수정 중..." : "리뷰 수정하기"}
              {/* {mutation.isPending ? "Editing..." : "Edit Review"} */}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
