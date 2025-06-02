"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { supabaseClient } from "@/lib/supabase/client";
import { useUserStore } from "@/providers/user-store-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import HeaderWithBackButton from "@/components/header-with-back-button";

export default function CreateBidPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.quotation_id as string;
  const user = useUserStore((selector) => selector.user);
  const queryClient = useQueryClient();

  const { data: availableTreatments, isLoading: treatmentsLoading } = useQuery({
    queryKey: ["clinic_treatments", user?.clinic_id],
    queryFn: () => fetchAvailableTreatments(user?.clinic_id),
    enabled: !!user?.clinic_id,
  });

  //to check if a bid already exists for this quotation
  // If a bid already exists, we will not allow the user to submit a new one
  const { data: existingBid, isLoading: bidLoading } = useQuery({
    queryKey: ["existing_bid", quotationId, user?.clinic_id],
    queryFn: () => fetchExistingBid(quotationId, user?.clinic_id),
    enabled: !!user?.clinic_id && !!quotationId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      treatmentId: existingBid?.clinic_treatment_id || "",
      expectedPrice: existingBid?.expected_price
        ? String(existingBid.expected_price)
        : "",
      additionalExplanation: existingBid?.additional_explanation || "",
      recommendQuickVisit: existingBid?.recommend_quick_visit || false,
    },
  });

  // Mutation for inserting a bid
  const insertBidMutation = useMutation({
    mutationFn: (values: FormValues) => insertBid(quotationId, values),
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
    !!existingBid || insertBidMutation.status === "pending" || bidLoading;

  return (
    <>
      <HeaderWithBackButton title="답변하기" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((e) => insertBidMutation.mutate(e))}
          className="max-w-md mx-auto p-4 space-y-6"
        >
          <h1 className="text-2xl font-bold mb-4">답변하기 {/* Answer */}</h1>
          <FormField
            control={form.control}
            name="treatmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>추천 시술 {/* Recommended Treatment */}</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={treatmentsLoading || isDisabled}
                  >
                    <SelectTrigger className="w-full min-h-[45px]">
                      <SelectValue placeholder="시술을 선택하세요" />{" "}
                      {/* Select a treatment */}
                    </SelectTrigger>
                    <SelectContent>
                      {availableTreatments &&
                        availableTreatments?.length > 0 &&
                        availableTreatments.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.treatment_name} {/* Treatment Name */}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expectedPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>예상 가격 {/* Expected Price */}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-[45px]"
                    placeholder="300,000원" // 300,000 KRW
                    type="number"
                    disabled={isDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="additionalExplanation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  추가설명(선택) {/* Additional Explanation (Optional) */}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    maxLength={300}
                    rows={4}
                    placeholder="추가 설명을 입력하세요." // Enter additional explanation.
                    disabled={isDisabled}
                  />
                </FormControl>
                <div className="text-right text-xs text-gray-400">
                  {form.watch("additionalExplanation")?.length || 0}/300{" "}
                  {/* /300 characters */}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recommendQuickVisit"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="recommendQuickVisit"
                    disabled={isDisabled}
                  />
                </FormControl>
                <FormLabel htmlFor="recommendQuickVisit">
                  빠른 내원 추천 {/* Recommend Quick Visit */}
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full btn-primary"
            disabled={isDisabled}
          >
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
    expectedPrice: z.string().min(1, "예상 가격을 입력하세요."), // Enter the expected price.
    additionalExplanation: z
      .string()
      .max(300, "300자 이내로 입력하세요.") // Enter within 300 characters.
      .optional(),
    recommendQuickVisit: z.boolean(),
  })
  .refine((data) => parseInt(data.expectedPrice), {
    path: ["expectedPrice"],
    message: "유효한 가격을 입력하세요.", // Enter a valid price.
  });

type FormValues = z.infer<typeof formSchema>;

// Separate fetch function for available treatments
async function fetchAvailableTreatments(clinic_id: string | undefined | null) {
  if (!clinic_id) return [];
  const { data, error } = await supabaseClient
    .from("clinic_treatment")
    .select("id, treatment_id, treatment:treatment_id (treatment_name)")
    .eq("clinic_id", clinic_id);

  if (error || !data) return [];
  return data.map((ct) => ({
    id: ct.id,
    treatment_name: ct.treatment?.treatment_name || "",
  }));
}

// Separate fetch function for existing bid
async function fetchExistingBid(
  quotationId: string,
  clinicId: string | undefined | null
) {
  if (!clinicId) return null;
  const { data: bid, error: bidError } = await supabaseClient
    .from("bid")
    .select("*, clinic_treatment(*)")
    .eq("quotation_id", quotationId)
    .eq("clinic_treatment.clinic_id", clinicId)
    .single();
  if (bidError || !bid) return null;
  return bid;
}

// Separate insert function for bid
async function insertBid(quotationId: string, values: FormValues) {
  const { error: insertError } = await supabaseClient
    .from("bid")
    .insert({
      quotation_id: quotationId,
      clinic_treatment_id: values.treatmentId,
      expected_price: Number(values.expectedPrice.replace(/[^0-9]/g, "")),
      additional_explanation: values.additionalExplanation || null,
      recommend_quick_visit: values.recommendQuickVisit,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Insert bid error:", insertError);
    throw new Error("등록에 실패했습니다. 다시 시도해주세요."); // Registration failed. Please try again.
  }
}
