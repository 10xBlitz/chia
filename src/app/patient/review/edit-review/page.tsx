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
import { deleteFileFromSupabase } from "@/lib/supabase/services/upload-file.services";
import FormTextarea from "@/components/form-ui/form-textarea";
import { SelectItem } from "@/components/ui/select";
import { Form } from "@/components/ui/form";
import FormSelect from "@/components/form-ui/form-select";
import FormStarRating from "@/components/form-ui/form-star-rating";
import FormMultiImageUpload from "@/components/form-ui/form-multi-image-upload";

const MAX_IMAGES = 10;
const MAX_TEXT = 500;

const reviewSchema = z.object({
  clinic_treatment_id: z.string().min(1, "시술을 선택해주세요."), // Please select a treatment
  rating: z.number().min(1, "평점을 입력해주세요.").max(5),
  review: z
    .string()
    .max(MAX_TEXT, `최대 ${MAX_TEXT}자까지 입력할 수 있습니다.`),
  images: z.object({
    files: z.array(z.any()),
    previews: z.array(z.string()),
  }),
});

/**
 * Type for review form values
 */
export type ReviewFormValues = z.infer<typeof reviewSchema>;

// Type for clinic_treatment with nested treatment
interface ClinicTreatment {
  id: string;
  treatment: {
    treatment_name: string;
  };
}

export default function EditReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("review_id") || "";
  const user = useUserStore((state) => state.user);
  const user_id = user?.id || "";
  const queryClient = useQueryClient();

  // Fetch review data
  const { data: reviewData, isLoading: reviewLoading } = useQuery({
    queryKey: ["review", reviewId],
    queryFn: async () => {
      if (!reviewId) return null;
      return fetchReviewById(reviewId);
    },
    enabled: !!reviewId,
  });

  // Fetch clinic treatments
  const clinic_id = reviewData?.clinic_treatment?.clinic_id || "";
  const { data: treatmentsData, isLoading: treatmentsLoading } = useQuery({
    queryKey: ["clinic-treatments", clinic_id],
    queryFn: async () => {
      if (!clinic_id) return [];
      const res = await getPaginatedClinicTreatments(clinic_id, 1, 100);
      return res.data || [];
    },
    enabled: !!clinic_id,
  });

  // Initialize form with fetched review data
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      clinic_treatment_id: undefined,
      rating: 4,
      review: "",
      images: { files: [], previews: [] },
    },
    values: reviewData
      ? {
          clinic_treatment_id: reviewData.clinic_treatment_id,
          rating: reviewData.rating || 4,
          review: reviewData.review || "",
          images: { files: [], previews: reviewData.images || [] },
        }
      : undefined,
  });

  // Helper: Get removed image URLs (existing images that were removed from preview)
  function getRemovedImageUrls() {
    if (!reviewData || !Array.isArray(reviewData.images)) return [];
    const currentPreviews = form.getValues("images").previews || [];
    return reviewData.images.filter(
      (url: string) =>
        !currentPreviews.includes(url) &&
        typeof url === "string" &&
        !url.startsWith("data:") &&
        !url.startsWith("blob:")
    );
  }

  const mutation = useMutation({
    mutationFn: async (values: ReviewFormValues) => {
      if (!user_id) throw new Error("로그인이 필요합니다."); // Login required
      // Delete removed images from Supabase storage on submit
      const removedUrls = getRemovedImageUrls();
      for (const url of removedUrls) {
        try {
          await deleteFileFromSupabase(url, { bucket: "review-images" });
        } catch (err) {
          console.error("Failed to delete image from storage", err);
        }
      }
      // Only save Supabase URLs (not data: or blob:) in the DB
      const supabaseUrls = (values.images.previews || []).filter(
        (url) =>
          typeof url === "string" &&
          !url.startsWith("data:") &&
          !url.startsWith("blob:")
      );
      return updateReview({
        review_id: reviewId,
        rating: values.rating,
        review: values.review,
        clinic_treatment_id: values.clinic_treatment_id,
        images: supabaseUrls,
      });
    },
    onSuccess: () => {
      toast.success("리뷰가 수정되었습니다."); // Review updated successfully.
      queryClient.invalidateQueries();
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
        <div className="p-4 text-center text-gray-400">로딩중...</div>{" "}
        {/* Loading... */}
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
            {treatmentsLoading ? (
              <div> 로딩 트리트먼트{/**loading treatmnents */}</div>
            ) : (
              <FormSelect
                control={form.control}
                name="clinic_treatment_id"
                label="시술" // Treatment
                placeholder="시술을 선택해주세요" // Please select a treatment
              >
                {(treatmentsData || []).map((t: ClinicTreatment) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.treatment?.treatment_name || ""}
                  </SelectItem>
                ))}
              </FormSelect>
            )}
          </div>
          {/* Image upload */}
          <div className="px-4 mt-6">
            <FormMultiImageUpload
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
              className="w-full btn-primary"
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
