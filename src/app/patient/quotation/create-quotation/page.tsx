"use client";

import FormAddress from "@/components/form-ui/form-address";
import FormDatePicker from "@/components/form-ui/form-date-picker-single";
import FormGender from "@/components/form-ui/form-gender";
import FormInput from "@/components/form-ui/form-input";
import FormMultiImageUploadV3 from "@/components/form-ui/form-multi-image-upload";
import FormSelect from "@/components/form-ui/form-select";
import FormTextarea from "@/components/form-ui/form-textarea";
import HeaderWithBackButton from "@/components/header-with-back-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormLabel } from "@/components/ui/form";
import { SelectItem } from "@/components/ui/select";
import { sendSolapiSMS } from "@/lib/send-sms";
import {
  getClinic,
  getClinicsForNotification,
} from "@/lib/supabase/services/clinics.services";
import { createQuotation } from "@/lib/supabase/services/quotation.services";
import {
  getPaginatedClinicTreatments,
  getPaginatedTreatments,
} from "@/lib/supabase/services/treatments.services";
import { calculateAge } from "@/lib/utils";
import { useUserStore } from "@/providers/user-store-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import {
  QUOTATION_MAX_IMAGES,
  QUOTATION_MAX_TEXT,
  QuotationFormValues,
  quotationSchema,
} from "./page.types";

export default function CreateQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinic_id = searchParams.get("clinic_id") || null;
  const user = useUserStore((state) => state.user);
  const [uploadingImageIdx, setUploadingImageIdx] = useState<number | null>(
    null
  );
  const title = searchParams.get("clinic_name")
    ? `견적 요청 - ${searchParams.get("clinic_name")}`
    : "견적 요청"; // Quotation Request

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
  });

  const { data: clinic, error: clinicError } = useQuery({
    queryKey: ["clinic-detail", clinic_id],
    queryFn: async () => await getClinic(clinic_id as string),
    enabled: !!clinic_id,
  });

  const queryClient = useQueryClient();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      region: "",
      name: "",
      gender: "",
      birthdate: new Date(),
      residence: "-",
      concern: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: QuotationFormValues) => {
      if (!user?.id) throw new Error("로그인이 필요합니다.");
      // Convert images to the new array format for v3
      const images = form.getValues("images") as Array<{
        status: "old" | "new" | "deleted" | "updated";
        file: string | File;
      }>;
      // Only pass File objects for 'new' and 'updated' images, in order
      const files = Array.isArray(images)
        ? images
            .filter(
              (img) =>
                (img.status === "new" || img.status === "updated") &&
                img.file instanceof File
            )
            .map((img) => img.file as File)
        : [];
      return createQuotation({
        ...values,
        region: values.region.split(",")[1]?.trim() || "", // Use first part of region
        user_id: user.id,
        clinic_id,
        images: files,
        setUploadingImageIdx,
      });
    },
    onSuccess: async (_, variables) => {
      setUploadingImageIdx(null); // reset after upload
      toast.success("견적 요청이 등록되었습니다.");

      const customerName = user?.full_name || user?.email || "Customer";

      const treatmentId = variables.treatment_id;

      if (clinic_id && clinic) {
        // Private quotation - send SMS to specific clinic
        const to = clinic?.user?.contact_number as string;
        const dentistName = clinic?.user?.full_name || "Dentist";
        const smsText = `안녕하세요, ${dentistName}님.\n\n${customerName}님이 견적을 요청하셨습니다.`; // Hello, #{dentistName}. #{customerName} has requested a quotation.
        const smsResult = await sendSolapiSMS({ to, text: smsText });

        if (!smsResult.ok) {
          console.log("-------->ERROR: SMS 전송 실패 (private quotation)");
          console.log(`------>ERROR: 메시지 전송 실패: ${smsResult.error}`);
        }
      } else {
        // Public quotation - send SMS to all matching clinics
        // if there is treatment id, fetch clinics that match the treatment
        // if there is not treatment id, fetch all clinics
        // this is done on the getClinicsForNotification function
        try {
          const matchingClinics = await getClinicsForNotification(treatmentId);

          console.log(
            `Found ${matchingClinics.length} matching clinics for treatment: ${treatmentId}`
          );

          // Send SMS to all matching clinics
          const smsPromises = matchingClinics.map(async (matchingClinic) => {
            const to = matchingClinic.notification_recipient?.contact_number;
            const dentistName =
              matchingClinic.notification_recipient?.full_name ||
              matchingClinic.clinic_name ||
              "Dentist";

            if (to) {
              const smsText = `안녕하세요, ${dentistName}님.\n\n${customerName}님이 견적을 요청하셨습니다.`; // Hello, #{dentistName}. #{customerName} has requested a quotation.
              return sendSolapiSMS({ to, text: smsText });
            }
            return { ok: false, error: "No contact number" };
          });

          const smsResults = await Promise.allSettled(smsPromises);
          const failedSMS = smsResults.filter(
            (result) =>
              result.status === "rejected" ||
              (result.status === "fulfilled" && !result.value.ok)
          );

          if (failedSMS.length > 0) {
            console.log(
              `-------->ERROR: ${failedSMS.length} SMS 전송 실패 (public quotation)`
            );
          }
        } catch (error) {
          console.log("-------->ERROR: 클리닉 조회 또는 SMS 전송 실패:", error);
        }
      }

      //display toast success message even though sms is not sent
      toast.success("견적 요청이 완료되었습니다"); // Quotation request completed

      queryClient.invalidateQueries({ queryKey: ["quotations", user?.id] });
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

  //add loading state for when user state is not yet available
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">사용자 정보를 불러오는 중...</p>
        {/* Loading user information... */}
      </div>
    );
  }

  if (clinicError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">
          치과 정보를 불러오는 중 오류가 발생했습니다.
        </p>
        {/* Error loading clinic information */}
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <HeaderWithBackButton title={title} /> {/**Request for Quote */}
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
                  form.setValue("gender", user.gender);
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
              내 정보 입력 {/* Fill in for myself */}
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
          {/* Age display - 나이 표시 (Age display) */}
          {form.watch("birthdate") && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-sm text-gray-600">나이: {/* Age: */}</span>
              <span className="text-sm font-medium text-blue-600">
                {calculateAge(form.watch("birthdate"))}세 {/* years old */}
              </span>
            </div>
          )}
          {/* <FormAddress
            control={form.control}
            name="residence"
            label="거주" // Residence
          /> */}
          <FormTextarea
            control={form.control}
            name="concern"
            label="고민/요청사항" // Concern/Request
            placeholder="고민이나 요청사항을 입력해주세요." /* Please enter your concern or request */
            maxLength={QUOTATION_MAX_TEXT}
          />
          {/* Image upload */}
          <FormMultiImageUploadV3
            control={form.control}
            name="images"
            maxImages={QUOTATION_MAX_IMAGES}
          />
          <Button
            type="submit"
            className="w-full mb-20 text-white"
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
