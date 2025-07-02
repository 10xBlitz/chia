"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useUserStore } from "@/providers/user-store-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectItem } from "@/components/ui/select";
import toast from "react-hot-toast";
import HeaderWithBackButton from "@/components/header-with-back-button";
import FormSelect from "@/components/form-ui/form-select";
import FormInput from "@/components/form-ui/form-input";
import FormTextarea from "@/components/form-ui/form-textarea";
import FormCheckbox from "@/components/form-ui/form-checkbox";
import { getPaginatedClinicTreatments } from "@/lib/supabase/services/treatments.services";
import {
  getClinicBidOnQuotation,
  insertBid,
} from "@/lib/supabase/services/bids.services";

export default function CreateBidPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.quotation_id as string;
  const user = useUserStore((selector) => selector.user);
  const queryClient = useQueryClient();

  const { data: availableTreatments } = useQuery({
    queryKey: ["clinic_treatments", user?.clinic_id],
    queryFn: () =>
      getPaginatedClinicTreatments(user?.clinic_id as string, 1, 1000),
    enabled: !!user?.clinic_id,
  });

  //to check if a bid already exists for this quotation
  // If a bid already exists, we will not allow the user to submit a new one
  const { data: existingBid, isLoading: existingBidLoading } = useQuery({
    queryKey: ["existing_bid", quotationId, user?.clinic_id],
    queryFn: () =>
      getClinicBidOnQuotation(quotationId, user?.clinic_id as string),
    enabled: !!user?.clinic_id && !!quotationId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      treatmentId: existingBid?.clinic_treatment_id || "",
      expectedPriceMin: existingBid?.expected_price_min
        ? String(existingBid.expected_price_min)
        : "",
      expectedPriceMax: existingBid?.expected_price_max
        ? String(existingBid.expected_price_max)
        : "",
      additionalExplanation: existingBid?.additional_explanation || "",
      recommendQuickVisit: existingBid?.recommend_quick_visit || false,
    },
  });

  // Mutation for inserting a bid
  const insertBidMutation = useMutation({
    mutationKey: ["insert_bid", quotationId],
    mutationFn: (values: FormValues) =>
      insertBid({
        quotation_id: quotationId,
        additional_explanation: values.additionalExplanation,
        clinic_treatment_id: values.treatmentId,
        expected_price_min: Number(
          values.expectedPriceMin.replace(/[^0-9]/g, "")
        ),
        expected_price_max: Number(
          values.expectedPriceMax.replace(/[^0-9]/g, "")
        ),
        recommend_quick_visit: values.recommendQuickVisit,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid", quotationId] });
      router.back();
    },
    onError: (error) => {
      //There was an error submitting the bid
      toast.error(error.message || "입찰서 제출 중 오류가 발생했습니다.");
    },
  });

  const isDisabled =
    !!existingBid ||
    insertBidMutation.status === "pending" ||
    existingBidLoading;

  return (
    <>
      <HeaderWithBackButton title="답변하기" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((e) => insertBidMutation.mutate(e))}
          className="max-w-md mx-auto p-4 space-y-6"
        >
          <FormSelect
            control={form.control}
            disabled={isDisabled}
            name="treatmentId"
            label="추천 시술" // Recommended Treatment
            placeholder="시술을 선택하세요" // Please select a treatment
          >
            {availableTreatments &&
              availableTreatments?.data?.length > 0 &&
              availableTreatments?.data?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.treatment.treatment_name} {/* Treatment Name */}
                </SelectItem>
              ))}
          </FormSelect>

          {/* Price Range Input - Professional UI */}
          <div>
            <label className="block font-pretendard-600 text-[16px] text-sm text-gray-700 mb-1">
              예상 가격 범위{" "}
              <span className="text-xs text-gray-400">(최소~최대, 원)</span>{" "}
              {/* Expected Price Range in KRW (Min~Max, Won) */}
            </label>
            <div className="flex items-center gap-2">
              <FormInput
                control={form.control}
                name="expectedPriceMin"
                label=""
                type="number"
                disabled={isDisabled}
                placeholder="최소 가격" // Min Price
                inputClassName="flex-1 rounded-r-none"
              />
              <span className="mx-1 text-gray-500">~</span>
              <FormInput
                control={form.control}
                name="expectedPriceMax"
                label=""
                type="number"
                disabled={isDisabled}
                placeholder="최대 가격" // Max Price
                inputClassName="flex-1 rounded-l-none"
              />
            </div>
          </div>

          <FormTextarea
            control={form.control}
            name="additionalExplanation"
            label="추가설명(선택)" // Additional Explanation (Optional)
            placeholder="추가 설명을 입력하세요" // Enter additional explanation
            maxLength={300}
          />

          <FormCheckbox
            control={form.control}
            name="recommendQuickVisit"
            formItemClassName="flex gap-3 items-center"
            label="빠른 내원 추천" // Recommend Quick Visit
            disabled={isDisabled}
          />

          <Button type="submit" className="w-full" disabled={isDisabled}>
            {existingBid
              ? "이미 답변이 등록되었습니다" // A bid has already been submitted.
              : insertBidMutation.status === "pending"
              ? "등록 중..."
              : "답변하기"}
            {/* Registering... / Submit Answer */}
          </Button>
        </form>
      </Form>
    </>
  );
}

const formSchema = z
  .object({
    treatmentId: z.string().min(1, "추천 시술을 선택하세요."), // Select a recommended treatment.
    expectedPriceMin: z.string().min(1, "예상 최소 가격을 입력하세요."), // Enter the expected min price.
    expectedPriceMax: z.string().min(1, "예상 최대 가격을 입력하세요."), // Enter the expected max price.
    additionalExplanation: z
      .string()
      .max(300, "300자 이내로 입력하세요.") // Enter within 300 characters.
      .optional(),
    recommendQuickVisit: z.boolean(),
  })
  .refine(
    (data) =>
      parseInt(data.expectedPriceMin) <= parseInt(data.expectedPriceMax),
    {
      path: ["expectedPriceMax"],
      message: "최대 가격은 최소 가격보다 크거나 같아야 합니다.", // Max price must be greater than or equal to min price.
    }
  )
  .refine(
    (data) =>
      parseInt(data.expectedPriceMin) > 0 &&
      parseInt(data.expectedPriceMax) > 0,
    {
      path: ["expectedPriceMin", "expectedPriceMax"],
      message: "가격은 0보다 커야 합니다.", // Price must be greater than 0.
    }
  );

type FormValues = z.infer<typeof formSchema>;
