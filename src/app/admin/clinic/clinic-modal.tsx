"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { CheckIcon, Trash2Icon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { ClinicTable } from "./columns";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
} from "@/components/ui/combobox";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { getPaginatedTreatments } from "@/lib/supabase/services/treatments.services";
import {
  CLINIC_IMAGE_ALLOWED_MIME_TYPES,
  CLINIC_IMAGE_BUCKET,
  CLINIC_IMAGE_MAX_FILE_SIZE_MB,
  insertClinic,
  updateClinic,
} from "@/lib/supabase/services/clinics.services";
import {
  insertClinicTreatment,
  markClinicTreatmentDeleted,
  updateClinicTreatment,
} from "@/lib/supabase/services/clinic-treatments.service";
import {
  deleteFileFromSupabase,
  uploadFileToSupabase,
} from "@/lib/supabase/services/upload-file.services";
import FormInput from "@/components/form-ui/form-input";
import FormContactNumber from "@/components/form-ui/form-contact-number";
// import FormAddress from "@/components/form-ui/form-address";
import FormDatePicker from "@/components/form-ui/form-date-picker-single";
import FormMultiImageUploadV3 from "@/components/form-ui/form-multi-image-upload-v3";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import FormTextarea from "@/components/form-ui/form-textarea";
import { Enums, TablesUpdate } from "@/lib/supabase/types";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import AddressSearch from "@/components/AddressSearch";
import { DAYS_OF_WEEK, formSchema } from "./clinic-modal.types";
import {
  deleteClinicWorkingHours,
  insertClinicWorkingHours,
} from "@/lib/supabase/services/working-hour.services";
import type { ClinicImageFormValue } from "./clinic-modal.types";

export const ClinicModal = ({
  data,
  open,
  onClose,
  onSuccess,
}: {
  data?: ClinicTable;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  // Fetch all treatments from DB for the select dropdown
  const { data: allTreatments, isLoading: treatmentsLoading } =
    useTanstackQuery({
      queryKey: ["all_treatments"],
      queryFn: async () => await getPaginatedTreatments(1, 1000),
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: data
      ? {
          clinic_name: data.clinic_name,
          introduction: data.introduction || "",
          contact_number: data.contact_number,
          full_address: data.full_address,
          detail_address: data.detail_address || "",
          region: data.region,
          city: data.city,
          link: data.link || "",
          opening_date: data.opening_date
            ? new Date(data.opening_date)
            : new Date(),
          pictures: (data.pictures || []).map((url: string) => ({
            status: "old",
            file: url,
          })),
          treatments:
            data.clinic_treatment?.map((item) => ({
              treatment_id: item.treatment.id.toString(),
              treatment_name: item.treatment.treatment_name,
              image_url: item.treatment.image_url,
              action: "old",
            })) || [],
          clinic_hours:
            typeof data === "object" &&
            data !== null &&
            "working_hour" in data &&
            Array.isArray((data as Record<string, unknown>)["working_hour"])
              ? (
                  (data as Record<string, unknown>)["working_hour"] as Array<{
                    day_of_week: string;
                    time_open: string;
                    note?: string;
                  }>
                ).map((h) => ({
                  day_of_week: h.day_of_week,
                  time_open: h.time_open,
                  note: h.note || "",
                }))
              : [],
        }
      : {
          clinic_name: "",
          introduction: "",
          contact_number: "",
          link: "",
          region: "",
          city: "",
          full_address: "",
          detail_address: "",
          opening_date: new Date(),
          pictures: [],
          treatments: [],
          clinic_hours: [],
        },
  });

  const {
    fields: treatmentFields,
    append,
    remove,
    update,
  } = useFieldArray({
    control: form.control,
    name: "treatments",
  });

  const {
    fields: clinicHourFields,
    append: appendClinicHour,
    remove: removeClinicHour,
  } = useFieldArray({
    control: form.control,
    name: "clinic_hours",
  });

  // For image preview per treatment
  const imagePreviews = useRef<{ [key: number]: string }>({});

  // Handle clinic images selection and preview
  const mutation = useMutation({
    mutationKey: [data ? "update_clinic" : "add_clinic", data?.id],
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (data) {
        return updateClinicWithImages(values, data!.id, setProgress);
      } else {
        return addClinicWithImages(values, setProgress);
      }
    },
    onSuccess: () => {
      form.reset();
      setLoading(false);
      toast.success(data ? "Clinic updated" : "Clinic created");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      setLoading(false);
      toast.error(error.message || "Something went wrong.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    console.log("---->clinic modal onSubmit: ", values);
    mutation.mutate(values);
  };

  // Track which treatment field ID is being confirmed for deletion
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);

  const confirmRemoveTreatment = (fieldId: string) => {
    // Find the real index in the treatmentFields array using the field id
    const realIndex = treatmentFields.findIndex(
      (field) => field.id === fieldId
    );
    if (realIndex === -1) return;

    const treatment = form.getValues(`treatments.${realIndex}`);
    console.log(
      "---->confirmRemoveTreatment: ",
      treatment,
      "realIndex:",
      realIndex
    );
    if (treatment.action === "old") {
      // Existing treatment: mark as deleted
      update(realIndex, { ...treatment, action: "deleted" });
    } else {
      // New treatment: remove from array
      remove(realIndex);
    }
  };

  // For custom day_of_week input

  const inputClassName = "text-sm sm:text-[16px] h-[40px] sm:h-[45px]";
  const formLabelClassName = "text-sm sm:text-[16px]";

  return (
    <>
      <Modal
        title={data ? "병원 편집" : "병원 추가"} // Edit Clinic / Add Clinic
        description={""}
        isOpen={open}
        isLong={true}
        onClose={() => {
          form.reset();
          onClose();
        }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="py-2">
            <div className="flex flex-col gap-8 w-full items-start justify-center">
              {/* 왼쪽: 병원 정보 (Left: Clinic Info) */}
              <div className="flex flex-col gap-3 w-full">
                <FormInput
                  control={form.control}
                  name="clinic_name"
                  label="병원 이름" // Clinic Name
                  formLabelClassName={formLabelClassName}
                  inputClassName={inputClassName}
                  placeholder="여기에 병원 이름을 입력하세요." // Enter clinic name here
                />

                <FormTextarea
                  control={form.control}
                  name="introduction"
                  label="병원 소개" // Clinic Introduction
                  placeholder="병원을 소개하는 글을 작성해주세요..." // Write an introduction about your clinic...
                  maxLength={500}
                  formLabelClassName={formLabelClassName}
                  inputClassName="h-[100px]"
                />

                <FormInput
                  control={form.control}
                  name="link"
                  label="병원 링크" // Hospital Link
                  placeholder="여기에 병원 링크를 입력하세요." // Enter hospital link here
                  formLabelClassName={formLabelClassName}
                  inputClassName={inputClassName}
                />
                <FormContactNumber
                  control={form.control}
                  name="contact_number"
                  label="연락처" // Contact Number
                  placeholder="연락처를 입력하세요." // Enter contact number here
                  formLabelClassName={formLabelClassName}
                  inputClassName={
                    "!min-h-[40px] !max-h-[40px] sm:!min-h-[45px]"
                  }
                />
                <AddressSearch
                  id="address"
                  defaultValue={form.getValues("full_address")}
                  onAddressSelect={(fullAddress, city, region) => {
                    console.log("---->clinic modal: address: ", {
                      fullAddress,
                      city,
                      region,
                    });
                    form.setValue("region", region);
                    form.setValue("city", city);
                    form.setValue("full_address", fullAddress);
                  }}
                  onChange={(e) => {
                    form.setValue("region", e.target.value);
                  }}
                  className={`mt-2 ${
                    form.formState.dirtyFields.region ? "border-red-500" : ""
                  }`}
                />

                <FormInput
                  control={form.control}
                  name="detail_address"
                  label="상세 주소" // Detail Address
                  formLabelClassName={formLabelClassName}
                  inputClassName={
                    "!min-h-[40px] !max-h-[40px] sm:!min-h-[45px]"
                  }
                  placeholder="상세 주소를 입력하세요." // Enter detail address here
                />
                <FormDatePicker
                  control={form.control}
                  name="opening_date"
                  label="개원일" // Opening Date
                />
                {/* 병원 이미지 (Clinic Images) */}
                <FormMultiImageUploadV3
                  control={form.control}
                  name="pictures"
                  label="병원 이미지" // Clinic Images
                  maxImages={10}
                  formLabelClassName={formLabelClassName}
                />
              </div>
              {/* 진료 항목 (Treatments Section) */}
              <div className="flex flex-col w-full max-w-xl">
                <div className="font-semibold mb-2">진료 항목</div>{" "}
                {/* Treatments */}
                {/* Show treatments level validation error */}
                {form.formState.errors.treatments && (
                  <p className="text-sm text-red-500 mb-2">
                    {form.formState.errors.treatments.message}
                  </p>
                )}
                {treatmentFields.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    아직 추가된 진료 항목이 없습니다. 플러스 아이콘을 클릭하여
                    진료 항목을 추가하세요.
                    {/* No treatments added yet. Click the plus icon to add a treatment. */}
                  </p>
                )}
                {treatmentFields
                  .filter((filterT) => filterT.action !== "deleted")
                  .map((item, filteredIndex) => {
                    // Find the real index in the original treatmentFields array
                    const realIndex = treatmentFields.findIndex(
                      (field) => field.id === item.id
                    );

                    return (
                      <section
                        key={item.id + filteredIndex}
                        className="relative grid grid-cols-2 gap-3 items-stretch w-full border rounded-md p-4 mb-2"
                      >
                        {/* 오른쪽 상단 삭제 버튼 (Delete button at top right) */}
                        <Button
                          className="absolute top-2 right-2 text-white bg-red-500 p-2 h-8 w-8"
                          type="button"
                          disabled={mutation.status === "pending"}
                          onClick={() => setDeleteFieldId(item.id)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                        {/* 진료명 및 가격 (Treatment Name and Price) */}
                        <div className="flex flex-col gap-2 justify-between h-full">
                          {treatmentsLoading ? (
                            <div>로딩 중... {/* Loading... */}</div>
                          ) : (
                            <FormField
                              control={form.control}
                              name={`treatments.${realIndex}.treatment_id`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>진료명</FormLabel>{" "}
                                  {/* Treatment */}
                                  <Combobox
                                    value={field.value}
                                    onValueChange={(e) => {
                                      field.onChange(e);
                                      const selected = allTreatments?.data.find(
                                        (t) => t.id === e
                                      );
                                      if (selected) {
                                        form.setValue(
                                          `treatments.${realIndex}.treatment_name`,
                                          selected.treatment_name
                                        );
                                        form.setValue(
                                          `treatments.${realIndex}.image_url`,
                                          selected.image_url || ""
                                        );
                                      }
                                      const currentTreatments =
                                        form.getValues("treatments");
                                      currentTreatments.forEach((t, idx) => {
                                        if (
                                          idx !== realIndex &&
                                          t.treatment_id === e &&
                                          t.action !== "deleted"
                                        ) {
                                          form.setValue(
                                            `treatments.${idx}.treatment_id`,
                                            ""
                                          );
                                          form.setValue(
                                            `treatments.${idx}.treatment_name`,
                                            ""
                                          );
                                          form.setValue(
                                            `treatments.${idx}.image_url`,
                                            ""
                                          );
                                        }
                                      });
                                    }}
                                    filterItems={(inputValue, items) =>
                                      items.filter(({ value }) => {
                                        const selectedIds = form
                                          .getValues("treatments")
                                          .filter(
                                            (t, idx) =>
                                              idx !== realIndex &&
                                              t.action !== "deleted"
                                          )
                                          .map((t) => t.treatment_id);
                                        if (selectedIds.includes(value))
                                          return false;
                                        const treatment =
                                          allTreatments?.data.find(
                                            (t) => t.id === value
                                          );
                                        return (
                                          !inputValue ||
                                          (treatment &&
                                            treatment.treatment_name
                                              .toLowerCase()
                                              .includes(
                                                inputValue.toLowerCase()
                                              ))
                                        );
                                      })
                                    }
                                  >
                                    <ComboboxInput
                                      placeholder="진료 항목을 선택하세요..."
                                      className="cursor-pointer"
                                      disabled={
                                        form.getValues(
                                          `treatments.${realIndex}.action`
                                        ) === "old"
                                      }
                                    />{" "}
                                    {/* Pick a treatment... */}
                                    <ComboboxContent>
                                      {allTreatments?.data.map(
                                        ({ id, treatment_name, image_url }) => (
                                          <ComboboxItem
                                            key={id}
                                            value={id}
                                            label={treatment_name}
                                            className="ps-8"
                                          >
                                            <span className="text-sm text-foreground flex items-center gap-2">
                                              {image_url && (
                                                <Image
                                                  src={image_url}
                                                  alt={treatment_name}
                                                  width={24}
                                                  height={24}
                                                  className="rounded object-cover"
                                                />
                                              )}
                                              {treatment_name}
                                            </span>
                                            {field.value === id && (
                                              <span className="absolute start-2 top-0 flex h-full items-center justify-center">
                                                <CheckIcon className="size-4" />
                                              </span>
                                            )}
                                          </ComboboxItem>
                                        )
                                      )}
                                      <ComboboxEmpty>
                                        검색 결과가 없습니다.
                                      </ComboboxEmpty>{" "}
                                      {/* No results. */}
                                    </ComboboxContent>
                                  </Combobox>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        {/* 오른쪽: 이미지 (Right: Image) */}
                        <div className="flex flex-col gap-2 items-center h-full justify-between">
                          <FormField
                            control={form.control}
                            name={`treatments.${realIndex}.image_url`}
                            render={() => (
                              <FormItem className="h-full flex flex-col justify-between">
                                <FormLabel>이미지</FormLabel> {/* Image */}
                                <FormControl>
                                  <div className="flex flex-col h-full justify-between">
                                    {(form.getValues(
                                      `treatments.${realIndex}.image_url`
                                    ) &&
                                      typeof form.getValues(
                                        `treatments.${realIndex}.image_url`
                                      ) !== "string" &&
                                      imagePreviews.current[realIndex] && (
                                        <Image
                                          src={imagePreviews.current[realIndex]}
                                          alt="미리보기"
                                          width={140}
                                          height={140}
                                          className="mt-2 w-full h-[92px] object-cover rounded"
                                        />
                                      )) ||
                                      (typeof form.getValues(
                                        `treatments.${realIndex}.image_url`
                                      ) === "string" &&
                                        form.getValues(
                                          `treatments.${realIndex}.image_url`
                                        ) && (
                                          <Image
                                            src={
                                              form.getValues(
                                                `treatments.${realIndex}.image_url`
                                              ) as string
                                            }
                                            width={140}
                                            height={140}
                                            alt="미리보기"
                                            className="mt-2 w-full h-[92px] object-cover rounded"
                                          />
                                        ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <ConfirmModal
                          title="진료 항목 삭제 확인" // Confirm Remove Treatment
                          description={`정말로 ${item.treatment_name} 항목을 삭제하시겠습니까?`} // Are you sure you want to remove ...
                          open={deleteFieldId === item.id}
                          onCancel={() => setDeleteFieldId(null)}
                          onConfirm={() => {
                            setDeleteFieldId(null);
                            confirmRemoveTreatment(item.id);
                          }}
                        />
                      </section>
                    );
                  })}
                <Button
                  type="button"
                  className="w-full mt-4"
                  disabled={mutation.status === "pending"}
                  onClick={() =>
                    append({
                      treatment_id: "",
                      treatment_name: "",
                      image_url: "",
                      action: "new",
                    })
                  }
                >
                  진료 항목 추가 {/* Add Treatment */}
                </Button>
              </div>
              {/* 진료시간 섹션 (Clinic Hours Section) */}
              <div className="pt-8 w-full">
                <div className="border-t border-t-muted py-4">
                  <div className="font-semibold mb-2">진료시간</div>{" "}
                  {/* Clinic Hours */}
                  {clinicHourFields.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      아직 추가된 진료시간이 없습니다. 플러스 아이콘을 클릭하여
                      진료시간을 추가하세요.
                      {/* No clinic hours added yet. Click the plus icon to add a clinic hour. */}
                    </p>
                  )}
                  {clinicHourFields.map((item, index) => {
                    return (
                      <section
                        key={item.id + index}
                        className="relative grid grid-cols-2 gap-3 items-stretch w-full border rounded-md p-4 mb-2"
                      >
                        {/* 오른쪽 상단 삭제 버튼 (Delete button at top right) */}
                        <Button
                          className="absolute top-2 right-2 text-white bg-red-500 p-2 h-8 w-8"
                          type="button"
                          onClick={() => removeClinicHour(index)}
                          disabled={mutation.status === "pending"}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                        {/* 요일 선택 (Day of Week Select with custom option) */}
                        <section className=" w-full flex flex-col gap-2">
                          <FormField
                            control={form.control}
                            name={`clinic_hours.${index}.day_of_week`}
                            disabled={mutation.status === "pending"}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-[16px] font-pretendard-600">
                                  요일
                                </FormLabel>{" "}
                                {/* Day */}
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="w-full min-h-[45px]">
                                    <SelectValue placeholder="요일을 선택하거나 직접 입력하세요" />{" "}
                                    {/* Select day or custom */}
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DAYS_OF_WEEK.map((d) => (
                                      <SelectItem
                                        key={d}
                                        value={d}
                                        className="cursor-pointer"
                                      >
                                        {d}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* 시간 (Time) */}
                          <FormInput
                            control={form.control}
                            name={`clinic_hours.${index}.time_open`}
                            label="진료 시간" // Clinic Hours
                            placeholder="예: 09:00 - 18:00" // e.g. 09:00 - 18:00
                            type="text"
                            disabled={mutation.status === "pending"}
                          />
                        </section>

                        {/* 비고 (Note) */}
                        <FormTextarea
                          formItemClassName="row-span-2 flex flex-col"
                          inputClassName="flex-1"
                          control={form.control}
                          name={`clinic_hours.${index}.note`}
                          label="비고" // Note
                          disabled={mutation.status === "pending"}
                          placeholder="예: 점심시간 없음" // e.g. No lunch break
                        />
                      </section>
                    );
                  })}
                  <Button
                    type="button"
                    className="w-full mt-4"
                    disabled={mutation.status === "pending"}
                    onClick={() =>
                      appendClinicHour({
                        day_of_week: "",
                        time_open: "",
                        note: "",
                      })
                    }
                  >
                    진료시간 추가 {/* Add Clinic Hour */}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {data ? "변경 사항 저장" : "병원 추가"} {progress}
                {/* Save Changes / Add Clinic */}
              </Button>
            </div>
          </form>
        </Form>
      </Modal>
    </>
  );
};

/**
 * Handles updating a clinic, including deleting old images, uploading new ones, updating, and removing as per image status.
 */
async function updateClinicWithImages(
  values: z.infer<typeof formSchema>,
  clinicId: string,
  setProgress?: (prog: string | null) => void
) {
  const images = (values.pictures as ClinicImageFormValue[]) || [];
  const clinicPictures: string[] = [];

  console.log("---->images", images);

  for (const img of images) {
    if (img.status === "deleted") {
      // Remove from storage if needed
      if (typeof img.file === "string") {
        setProgress?.("삭제된 이미지 제거 중..."); // Removing deleted images...
        try {
          await deleteFileFromSupabase(img.file, {
            bucket: CLINIC_IMAGE_BUCKET,
          });
        } catch (error) {
          console.error("Failed to delete image:", img.file, error);
        }
      }
      continue; // Do not add to DB array
    }

    if (img.status === "old" && typeof img.file === "string") {
      clinicPictures.push(img.file);
      continue;
    }

    if (img.status === "new" && img.file instanceof File) {
      setProgress?.("병원 이미지 업로드 중...");
      const publicUrl = await uploadFileToSupabase(img.file, {
        bucket: CLINIC_IMAGE_BUCKET,
        allowedMimeTypes: CLINIC_IMAGE_ALLOWED_MIME_TYPES,
        maxSizeMB: CLINIC_IMAGE_MAX_FILE_SIZE_MB,
      });
      clinicPictures.push(publicUrl);

      continue;
    }

    if (img.status === "updated" && img.file instanceof File && img.oldUrl) {
      setProgress?.("이미지 교체 중..."); //Replacing image...
      // Delete old image
      await deleteFileFromSupabase(img.oldUrl, {
        bucket: CLINIC_IMAGE_BUCKET,
      });

      // Upload new image
      const publicUrl = await uploadFileToSupabase(img.file, {
        bucket: CLINIC_IMAGE_BUCKET,
        allowedMimeTypes: CLINIC_IMAGE_ALLOWED_MIME_TYPES,
        maxSizeMB: CLINIC_IMAGE_MAX_FILE_SIZE_MB,
      });
      clinicPictures.push(publicUrl);

      continue;
    }
  }

  setProgress?.(null);

  // Update clinic (with new or existing images)
  const clinicPayload: TablesUpdate<"clinic"> = {
    ...values,
    link: values.link || "",
    introduction: values.introduction || null,
    pictures: clinicPictures,
    detail_address: values.detail_address || null,
    region: values.region || "",
    city: values.city || "",
    full_address: values.full_address || "",
    status: "active",
    opening_date: values.opening_date.toDateString(),
  };

  setProgress?.("병원 업데이트 중..."); // Updating clinic...
  await updateClinic(clinicId, clinicPayload, clinicPictures);

  // Save working hours
  setProgress?.("진료시간 저장 중..."); // Saving clinic working hours...
  if (values.clinic_hours && values.clinic_hours.length > 0) {
    const workingHours = values.clinic_hours.map((h) => ({
      day_of_week: h.day_of_week as Enums<"day_of_week">, // Cast to the correct type
      time_open: h.time_open,
      note: h.note,
    }));

    await deleteClinicWorkingHours(clinicId);
    await insertClinicWorkingHours(clinicId, workingHours);
  } else {
    await deleteClinicWorkingHours(clinicId);
  }

  // Save treatments
  setProgress?.("트리트먼트 저장 중..."); // Saving treatments...
  await saveTreatmentsForClinic(values.treatments, clinicId);
}

/**
 * Handles adding a new clinic, uploading images, and saving treatments and working hours.
 * Accepts the new image status array format.
 */
async function addClinicWithImages(
  values: z.infer<typeof formSchema>,
  setProgress?: (prog: string | null) => void
) {
  const images = (values.pictures as ClinicImageFormValue[]) || [];
  const clinicPictures: string[] = [];

  for (const img of images) {
    if (img.status === "deleted") {
      // Do not add to DB array
      continue;
    }
    if (img.status === "old" && typeof img.file === "string") {
      clinicPictures.push(img.file);
    } else if (img.status === "new" && img.file instanceof File) {
      setProgress?.("병원 이미지 업로드 중...");
      try {
        const publicUrl = await uploadFileToSupabase(img.file, {
          bucket: CLINIC_IMAGE_BUCKET,
          allowedMimeTypes: CLINIC_IMAGE_ALLOWED_MIME_TYPES,
          maxSizeMB: CLINIC_IMAGE_MAX_FILE_SIZE_MB,
        });
        clinicPictures.push(publicUrl);
      } catch (error) {
        console.error("Failed to upload image:", img.file.name, error);
        throw error;
      }
    } else if (
      img.status === "updated" &&
      img.file instanceof File &&
      img.oldUrl
    ) {
      // For new clinics, treat updated as new (upload only)
      setProgress?.("병원 이미지 업로드 중...");
      try {
        const publicUrl = await uploadFileToSupabase(img.file, {
          bucket: CLINIC_IMAGE_BUCKET,
          allowedMimeTypes: CLINIC_IMAGE_ALLOWED_MIME_TYPES,
          maxSizeMB: CLINIC_IMAGE_MAX_FILE_SIZE_MB,
        });
        clinicPictures.push(publicUrl);
      } catch (error) {
        console.error("Failed to upload updated image:", img.file.name, error);
        throw error;
      }
    }
  }
  setProgress?.(null);

  // Create clinic
  const clinicPayload = {
    ...values,
    link: values.link || "",
    introduction: values.introduction || null,
    pictures: clinicPictures,
    opening_date: values.opening_date.toDateString(),
    region: values.region || "",
    city: values.city || "",
    full_address: values.full_address || "",
    detail_address: values.detail_address || null,
  };
  const newClinicId = await insertClinic(clinicPayload, clinicPictures);

  // Save working hours
  if (values.clinic_hours && values.clinic_hours.length > 0) {
    const workingHours = values.clinic_hours.map((h) => ({
      day_of_week: h.day_of_week as Enums<"day_of_week">, // Cast to the correct type
      time_open: h.time_open,
      note: h.note,
    }));
    await insertClinicWorkingHours(newClinicId, workingHours);
  }

  // Save treatments
  await saveTreatmentsForClinic(values.treatments, newClinicId);
}

/**
 * Saves treatments for a clinic.
 * Handles adding, updating, or marking treatments as deleted based on their action.
 *
 * @param treatments - Array of treatment objects with action flags.
 * @param clinicId - The clinic ID to associate treatments with.
 * @param setUploadingFileIndex - Optional callback to set uploading file index for UI feedback.
 */
async function saveTreatmentsForClinic(
  treatments: z.infer<typeof formSchema>["treatments"],
  clinicId: string,
  setUploadingFileIndex?: (idx: number | null) => void
) {
  for (const t of treatments) {
    if (t.action === "deleted" && t.treatment_id) {
      await markClinicTreatmentDeleted(clinicId, t.treatment_id);
    } else if (t.action === "new" && t.treatment_id) {
      await insertClinicTreatment(clinicId, t.treatment_id);
    } else if ((t.action === "updated" || !t.action) && t.treatment_id) {
      // Fix typo in updateClinicTreatment usage
      await updateClinicTreatment(clinicId, t.treatment_id);
    }
    // else: skip
  }
  if (setUploadingFileIndex) setUploadingFileIndex(null);
}
