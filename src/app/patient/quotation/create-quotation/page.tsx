"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserStore } from "@/providers/user-store-provider";
import {
  getPaginatedClinicTreatments,
  getPaginatedTreatments,
} from "@/lib/supabase/services/treatments.services";
import { SelectItem } from "@/components/ui/select";
import { createQuotation } from "@/lib/supabase/services/quotation.services";
import {
  QUOTATION_MAX_IMAGES,
  QUOTATION_MAX_TEXT,
  QuotationFormValues,
  quotationSchema,
} from "./page.types";
import HeaderWithBackButton from "@/components/header-with-back-button";
import FormSelect from "@/components/form-ui/form-select";
import FormInput from "@/components/form-ui/form-input";
import FormGender from "@/components/form-ui/form-gender";
import FormDatePicker from "@/components/form-ui/form-date-picker-single";
import FormAddress from "@/components/form-ui/form-address";
import FormTextarea from "@/components/form-ui/form-textarea";
import FormMultiImageUpload from "@/components/form-ui/form-multi-image-upload";

export default function CreateQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinic_id = searchParams.get("clinic_id") || null;
  const user = useUserStore((state) => state.user);
  const [uploadingImageIdx, setUploadingImageIdx] = useState<number | null>(
    null
  );

  // Treatments fetch
  const { data: treatmentsData } = useQuery({
    queryKey: ["clinic-treatments", clinic_id],
    queryFn: async () => {
      if (clinic_id) {
        //fetch treatments for specific clinic (private quotation)
        const res = await getPaginatedClinicTreatments(clinic_id, 1, 100);
        console.log("---->fetched treatments:", res.data);
        const formattedTreatments = res.data?.map((t) => ({
          id: t.treatment_id,
          treatment_name: t.treatment?.treatment_name,
          image_url: t.treatment?.image_url,
        }));

        return formattedTreatments || [];
      } else {
        //fetch all treatments (public quotation)
        const res = await getPaginatedTreatments(1, 1000);
        return res.data || [];
      }
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const queryClient = useQueryClient();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      region: "",
      name: "",
      gender: "",
      birthdate: new Date(),
      residence: "",
      concern: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: QuotationFormValues) => {
      if (!user?.id) throw new Error("로그인이 필요합니다.");
      return createQuotation({
        ...values,
        region: values.region,
        user_id: user.id,
        clinic_id,
        images: form.getValues("images")?.files,
        setUploadingImageIdx,
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
    <>
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <HeaderWithBackButton title="견적 요청" /> {/**Request for Quote */}
          <FormSelect
            control={form.control}
            name="treatment_id"
            label="시술" /* Treatment */
            placeholder="시술을 선택해주세요" /* Please select a treatment */
          >
            {treatmentsData &&
              treatmentsData?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.treatment_name || "시술" /* Treatment */}
                </SelectItem>
              ))}
          </FormSelect>
          {/* Fill in for myself */}
          <div className="flex gap-3">
            <Checkbox
              onCheckedChange={(e) => {
                if (e && user) {
                  form.setValue("name", user.full_name || "");
                  form.setValue("gender", user.gender || "male");
                  form.setValue("birthdate", new Date(user.birthdate || ""));
                  form.setValue("residence", user.residence);
                  form.setValue("region", user.residence || "");
                  console.log("---->form:", form.getValues());
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
          <FormAddress
            control={form.control}
            name="region"
            label="지역" // Region
          />
          <FormInput
            control={form.control}
            name="name"
            label="이름" // Name
            placeholder="이름을 입력해주세요" // Please enter your name
          />
          <FormGender
            control={form.control}
            name="gender"
            label="성별" // Gender
          />
          <FormDatePicker
            control={form.control}
            name="birthdate"
            label="생년월일" // Birthdate
          />
          <FormAddress
            control={form.control}
            name="residence"
            label="거주" // Residence
          />
          <FormTextarea
            control={form.control}
            name="concern"
            label="고민/요청사항" // Concern/Request
            placeholder="고민이나 요청사항을 입력해주세요." /* Please enter your concern or request */
            maxLength={QUOTATION_MAX_TEXT}
          />
          {/* Image upload */}
          <FormMultiImageUpload
            control={form.control}
            name="images" // for { images: { files: File[], previews: string[] } }
            maxImages={QUOTATION_MAX_IMAGES}
          />
          <Button
            type="submit"
            className="w-full btn-primary mb-20 text-white"
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
        </form>
      </Form>
    </>
  );
}
