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
import FormMultiImageUpload from "@/components/form-ui/form-multi-image-upload";

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
import { KoreanTimePicker } from "@/components/time-picker";

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
                    time_open_from: string;
                    time_open_to: string;
                    note?: string;
                  }>
                ).reduce(
                  (acc, h) => {
                    // Group working hours by time range
                    const timeKey = `${h.time_open_from}-${h.time_open_to}`;
                    const existing = acc.find(
                      (item) =>
                        `${item.time_open_from}-${item.time_open_to}` ===
                        timeKey
                    );
                    if (existing) {
                      existing.selected_days.push(h.day_of_week);
                    } else {
                      acc.push({
                        selected_days: [h.day_of_week],
                        time_open_from: h.time_open_from,
                        time_open_to: h.time_open_to,
                      });
                    }
                    return acc;
                  },
                  [] as Array<{
                    selected_days: string[];
                    time_open_from: string;
                    time_open_to: string;
                  }>
                )
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
                <FormMultiImageUpload
                  control={form.control}
                  name="pictures"
                  label="병원 이미지" // Clinic Images
                  maxImages={10}
                  disabled={mutation.status === "pending"}
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
                  {/* Show summary of assigned days */}
                  {clinicHourFields.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">
                        설정된 요일 현황 {/* Day Assignment Status */}
                      </p>
                      <div className="text-xs text-blue-700">
                        {(() => {
                          const allAssignedDays =
                            form
                              .getValues("clinic_hours")
                              ?.flatMap((h) => h.selected_days || []) || [];
                          const uniqueAssignedDays = [
                            ...new Set(allAssignedDays),
                          ];
                          const unassignedDays = DAYS_OF_WEEK.filter(
                            (day) => !uniqueAssignedDays.includes(day)
                          );

                          return (
                            <div className="space-y-1">
                              {uniqueAssignedDays.length > 0 && (
                                <p>
                                  <span className="font-medium">설정됨:</span>{" "}
                                  {uniqueAssignedDays.join(", ")}
                                </p>
                              )}
                              {unassignedDays.length > 0 && (
                                <p>
                                  <span className="font-medium">미설정:</span>{" "}
                                  {unassignedDays.join(", ")}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  {clinicHourFields.map((item, index) => {
                    // --- Add validation: from < to ---
                    // const from = form.watch(
                    //   `clinic_hours.${index}.time_open_from`
                    // );
                    // const to = form.watch(`clinic_hours.${index}.time_open_to`);
                    // let isTimeInvalid = false;
                    // if (from && to) {
                    //   const [fromH, fromM] = from.split(":").map(Number);
                    //   const [toH, toM] = to.split(":").map(Number);
                    //   isTimeInvalid =
                    //     fromH > toH || (fromH === toH && fromM >= toM);
                    // }
                    return (
                      <section
                        key={item.id + index}
                        className="relative grid grid-cols-1 gap-3 items-stretch w-full border rounded-md p-4 mb-2"
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

                        {/* 요일 선택 (Day of Week Checkboxes) */}
                        <FormField
                          control={form.control}
                          name={`clinic_hours.${index}.selected_days`}
                          disabled={mutation.status === "pending"}
                          render={({ field }) => {
                            // Get current form values to calculate disabled days in real-time
                            const currentFormValues =
                              form.getValues("clinic_hours") || [];
                            const allSelectedDays = currentFormValues
                              .filter((_, idx) => idx !== index)
                              .flatMap((hours) => hours.selected_days || []);

                            return (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-[16px] font-pretendard-600">
                                  요일 선택 {/* Select Days */}
                                </FormLabel>
                                <div className="grid grid-cols-2 gap-2">
                                  {DAYS_OF_WEEK.map((day) => {
                                    const isDisabled =
                                      allSelectedDays.includes(day);
                                    const isChecked =
                                      field.value?.includes(day) || false;

                                    return (
                                      <label
                                        key={day}
                                        className={`flex items-center space-x-2 p-2 border rounded cursor-pointer transition-colors ${
                                          isDisabled && !isChecked
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                                            : isChecked
                                            ? "bg-blue-50 border-blue-300"
                                            : "hover:bg-gray-50 border-gray-300"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          disabled={isDisabled && !isChecked}
                                          checked={isChecked}
                                          onChange={(e) => {
                                            const currentValue =
                                              field.value || [];
                                            let newValue;
                                            if (e.target.checked) {
                                              newValue = [...currentValue, day];
                                            } else {
                                              newValue = currentValue.filter(
                                                (d) => d !== day
                                              );
                                            }
                                            field.onChange(newValue);
                                            form.trigger("clinic_hours"); // Re-validate on day change for UI update
                                          }}
                                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm">{day}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                <FormMessage />
                                {/* Show a helpful message if no days are selected */}
                                {(!field.value || field.value.length === 0) && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    최소 하나의 요일을 선택해주세요.{" "}
                                    {/* Please select at least one day. */}
                                  </p>
                                )}
                                {/* Show selected days count */}
                                {field.value && field.value.length > 0 && (
                                  <p className="text-xs text-green-600 mt-1">
                                    선택된 요일: {field.value.length}개{" "}
                                    {/* Selected days: {count} */}
                                  </p>
                                )}
                              </FormItem>
                            );
                          }}
                        />

                        {/* 진료 시간 (Operating Hours) */}
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`clinic_hours.${index}.time_open_from`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  진료 시작 시간 {/* Clinic Start Time */}
                                </FormLabel>
                                <FormControl>
                                  <KoreanTimePicker
                                    disabled={mutation.status === "pending"}
                                    time={field.value}
                                    setSelected={(e) => field.onChange(e)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`clinic_hours.${index}.time_open_to`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  진료 종료 시간 {/* Clinic End Time */}
                                </FormLabel>
                                <FormControl>
                                  <KoreanTimePicker
                                    disabled={mutation.status === "pending"}
                                    time={field.value}
                                    setSelected={(e) => field.onChange(e)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        {false && (
                          <p className="text-xs text-red-600 mt-2">
                            시작 시간은 종료 시간보다 빨라야 합니다.{" "}
                            {/* Start time must be before end time. */}
                          </p>
                        )}
                      </section>
                    );
                  })}
                  <Button
                    type="button"
                    className="w-full mt-4"
                    disabled={mutation.status === "pending"}
                    onClick={() =>
                      appendClinicHour({
                        selected_days: [],
                        time_open_from: "",
                        time_open_to: "",
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
    const workingHours = values.clinic_hours.flatMap((h) =>
      h.selected_days.map((day) => ({
        day_of_week: day as Enums<"day_of_week">, // Cast to the correct type
        time_open_from: h.time_open_from,
        time_open_to: h.time_open_to,
      }))
    );

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
    if (img.status === "deleted") continue; // skip deleted

    if (img.status === "old" && typeof img.file === "string") {
      clinicPictures.push(img.file);
      continue;
    }

    if (img.status === "new" && img.file instanceof File) {
      setProgress?.("병원 이미지 업로드 중..."); // Uploading new images...
      const publicUrl = await uploadFileToSupabase(img.file, {
        bucket: CLINIC_IMAGE_BUCKET,
        allowedMimeTypes: CLINIC_IMAGE_ALLOWED_MIME_TYPES,
        maxSizeMB: CLINIC_IMAGE_MAX_FILE_SIZE_MB,
      });
      clinicPictures.push(publicUrl);
      continue;
    }

    if (img.status === "updated" && img.file instanceof File && img.oldUrl) {
      // For new clinics, treat updated as new (upload only)
      setProgress?.("병원 이미지 업로드 중...");
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
    const workingHours = values.clinic_hours.flatMap((h) =>
      h.selected_days.map((day) => ({
        day_of_week: day as Enums<"day_of_week">, // Cast to the correct type
        time_open_from: h.time_open_from,
        time_open_to: h.time_open_to,
      }))
    );
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
