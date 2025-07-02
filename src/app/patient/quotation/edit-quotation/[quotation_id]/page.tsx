"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import HeaderWithBackButton from "@/components/header-with-back-button";
import FormSelect from "@/components/form-ui/form-select";
import FormInput from "@/components/form-ui/form-input";
import FormGender from "@/components/form-ui/form-gender";
import FormDatePicker from "@/components/form-ui/form-date-picker-single";
import FormAddress from "@/components/form-ui/form-address";
import FormTextarea from "@/components/form-ui/form-textarea";
import FormMultiImageUploadV3 from "@/components/form-ui/form-multi-image-upload";
import { SelectItem } from "@/components/ui/select";
import {
  getSingleQuotation,
  updateQuotation,
} from "@/lib/supabase/services/quotation.services";
import {
  getPaginatedClinicTreatments,
  getPaginatedTreatments,
} from "@/lib/supabase/services/treatments.services";
import { useUserStore } from "@/providers/user-store-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { quotationEditSchema, QuotationEditFormValues } from "./page.types";

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params?.quotation_id as string;
  const queryClient = useQueryClient();

  // Fetch quotation details
  const { data: quotation, isLoading: isQuotationLoading } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => getSingleQuotation(quotationId),
    enabled: !!quotationId,
  });

  // Treatments fetch (unified logic)
  const clinic_id = quotation?.clinic_id;
  const { data: treatments = [] } = useQuery({
    queryKey: ["clinic-treatments", clinic_id],
    queryFn: async () => {
      if (clinic_id) {
        // fetch treatments for specific clinic (private quotation)
        const res = await getPaginatedClinicTreatments(clinic_id, 1, 100);
        const formattedTreatments = res.data?.map((t) => ({
          id: t.treatment_id,
          treatment_name: t.treatment?.treatment_name,
          image_url: t.treatment?.image_url,
        }));
        return formattedTreatments || [];
      } else {
        // fetch all treatments (public quotation)
        const res = await getPaginatedTreatments(1, 1000);
        return res.data || [];
      }
    },
  });
  const formattedTreatments = treatments.map((t) => ({
    id: t.id,
    treatment_name: t.treatment_name,
  }));

  const form = useForm<QuotationEditFormValues>({
    resolver: zodResolver(quotationEditSchema),
    defaultValues: {
      treatmentId: quotation?.treatment_id ?? "none",
      region: quotation?.region || "",
      name: quotation?.name || "",
      gender: quotation?.gender || "",
      birthdate: quotation?.birthdate
        ? new Date(quotation.birthdate)
        : new Date(),
      residence: quotation?.residence || "",
      concern: quotation?.concern || "",
      images: Array.isArray(quotation?.image_url)
        ? quotation.image_url.map((url: string) => ({
            status: "old",
            file: url,
          }))
        : [],
    },
    values: quotation
      ? {
          treatmentId: quotation.treatment_id ?? "none",
          region: quotation.region || "",
          name: quotation.name || "",
          gender: quotation.gender || "",
          birthdate: quotation.birthdate
            ? new Date(quotation.birthdate)
            : new Date(),
          residence: quotation.residence || "",
          concern: quotation.concern || "",
          images: Array.isArray(quotation.image_url)
            ? quotation.image_url.map((url: string) => ({
                status: "old",
                file: url,
              }))
            : [],
        }
      : undefined,
  });

  useEffect(() => {
    if (quotation) {
      form.reset({
        treatmentId: quotation.treatment_id ?? "none",
        region: quotation.region || "",
        name: quotation.name || "",
        gender: quotation.gender || "",
        birthdate: quotation.birthdate
          ? new Date(quotation.birthdate)
          : new Date(),
        residence: quotation.residence || "",
        concern: quotation.concern || "",
        images: Array.isArray(quotation.image_url)
          ? quotation.image_url.map((url: string) => ({
              status: "old",
              file: url,
            }))
          : [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotation]);

  const mutation = useMutation({
    mutationFn: async (values: QuotationEditFormValues) => {
      if (!quotation) throw new Error("견적 정보를 불러올 수 없습니다."); // Cannot load quotation info
      // Pass images as-is (v3 schema)
      await updateQuotation({
        quotation_id: quotation.id,
        treatment_id: values.treatmentId,
        region: values.region,
        name: values.name,
        gender: values.gender,
        birthdate: values.birthdate,
        residence: values.residence,
        concern: values.concern,
        images: values.images, // v3 schema: { status, file, oldUrl? }
        patient_id: quotation.patient_id,
        clinic_id: quotation.clinic_id,
      });
    },
    onSuccess: () => {
      toast.success("견적이 수정되었습니다."); // Quotation updated
      queryClient.invalidateQueries();
      router.back();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "수정에 실패했습니다.");
    },
  });

  const onSubmit = (values: QuotationEditFormValues) => {
    mutation.mutate(values);
  };

  const user = useUserStore((state) => state.user);
  const [useMyData, setUseMyData] = useState(false);

  // Helper to fill form with user or quotation data
  const fillForm = (source: "user" | "quotation") => {
    if (source === "user" && user) {
      form.setValue("name", user.full_name || "");
      form.setValue("gender", user.gender || "");
      form.setValue(
        "birthdate",
        user.birthdate ? new Date(user.birthdate) : new Date()
      );
      form.setValue("residence", user.residence || "");
      form.setValue("region", user.residence || "");
    } else if (source === "quotation" && quotation) {
      form.setValue("name", quotation.name || "");
      form.setValue("gender", quotation.gender || "");
      form.setValue(
        "birthdate",
        quotation.birthdate ? new Date(quotation.birthdate) : new Date()
      );
      form.setValue("residence", quotation.residence || "");
      form.setValue("region", quotation.region || "");
    }
  };

  // Checkbox handler
  const handleUseMyDataChange = (checked: boolean) => {
    setUseMyData(checked);
    if (checked) {
      fillForm("user");
    } else {
      fillForm("quotation");
    }
  };

  return (
    <>
      <HeaderWithBackButton title="견적 수정" /> {/* Edit Quotation */}
      <Form {...form}>
        <form
          className="flex flex-col gap-4 pb-20"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormSelect
            control={form.control}
            name="treatmentId"
            label="시술" // Treatment
            placeholder="시술을 선택하세요" // Please select a treatment
          >
            <SelectItem key="none" value="none">
              선택 안 함 {/* None */}
            </SelectItem>
            {formattedTreatments.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.treatment_name}
              </SelectItem>
            ))}
          </FormSelect>

          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              id="use-my-data"
              checked={useMyData}
              onCheckedChange={handleUseMyDataChange}
            />
            <label
              htmlFor="use-my-data"
              className="text-sm select-none cursor-pointer"
            >
              내 정보로 자동입력 {/* Autofill with my data */}
            </label>
          </div>
          <FormInput
            control={form.control}
            name="region"
            label="지역" // Region
            placeholder="지역을 입력하세요" // Please enter a region
          />
          <FormInput
            control={form.control}
            name="name"
            label="이름" // Name
            placeholder="이름을 입력하세요" // Please enter a name
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
            label="주소" // Address
          />
          <FormTextarea
            control={form.control}
            name="concern"
            label="고민/요청사항(선택)" // Concern/Request (Optional)
            placeholder="고민이나 요청사항을 입력하세요." // Please enter your concern or request
            maxLength={500}
          />
          <FormMultiImageUploadV3
            control={form.control}
            name="images"
            maxImages={5}
          />
          <Button
            type="submit"
            className="w-full text-white"
            disabled={mutation.isPending || isQuotationLoading}
          >
            {mutation.isPending ? "수정 중..." : "수정하기"}{" "}
            {/* Editing... / Edit */}
          </Button>
        </form>
      </Form>
    </>
  );
}
