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
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

import { CheckIcon, Trash2Icon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { ClinicTable } from "./columns";
import { supabaseClient } from "@/lib/supabase/client";
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
import { ConfirmDeleteModal } from "@/components/modals/confirm-modal";
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
import FormAddress from "@/components/form-ui/form-address";
import FormDatePicker from "@/components/form-ui/form-date-picker-single";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  insertClinicWorkingHours,
  deleteClinicWorkingHours,
} from "@/lib/supabase/services/clinics.services";
import FormTextarea from "@/components/form-ui/form-textarea";

// 요일을 한글로, 영어 주석 추가 (Days of week in Korean, with English comments)
const DAYS_OF_WEEK = [
  "월요일", // Monday
  "화요일", // Tuesday
  "수요일", // Wednesday
  "목요일", // Thursday
  "금요일", // Friday
  "토요일", // Saturday
  "일요일", // Sunday
];

// Add ClinicHour type for typing
export type ClinicHour = {
  day_of_week: string;
  time_open: string;
  note?: string;
};

const formSchema = z.object({
  clinic_name: z.string().min(1, "Clinic name is required"),
  contact_number: z.string().min(1, "Contact number is required"),
  location: z.string().min(1, "Location is required"),
  region: z.string().min(1, "Region is required"),
  link: z.string().url("Link must be a valid URL").optional(),
  opening_date: z.date({ required_error: "Opening date is required" }),
  pictures: z.any().optional(), // For clinic images
  treatments: z.array(
    z.object({
      treatment_id: z.string().nullable(),
      treatment_name: z.string().min(1, "Treatment name is required"),
      image_url: z.any(),
      price: z.coerce.number().min(0, "Price is required"),
      action: z.enum(["new", "updated", "deleted", "old"]),
    })
  ),
  clinic_hours: z
    .array(
      z.object({
        day_of_week: z.string().min(1, "Day is required"),
        time_open: z.string().min(1, "Time is required"),
        note: z.string().optional(),
      })
    )
    .optional(),
});

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
  const [clinicImagePreviews, setClinicImagePreviews] = useState<string[]>(
    data?.pictures || []
  );
  const [clinicImageFiles, setClinicImageFiles] = useState<File[]>([]);

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
          contact_number: data.contact_number,
          location: data.location,
          region: data.region,
          link: data.link || "",
          opening_date: data.opening_date
            ? new Date(data.opening_date)
            : new Date(),
          treatments:
            data.clinic_treatment?.map((item) => ({
              treatment_id: item.treatment.id.toString(),
              treatment_name: item.treatment.treatment_name,
              image_url: item.treatment.image_url,
              price: item.price,
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
          contact_number: "",
          location: "",
          link: "",
          region: "",
          opening_date: new Date(),
          treatments: [],
          clinic_hours: [],
        },
  });

  const { fields, append, remove, update } = useFieldArray({
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
  const handleClinicImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setClinicImageFiles(files);
    const previews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push(reader.result as string);
        if (previews.length === files.length) {
          setClinicImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
    if (files.length === 0) setClinicImagePreviews([]);
  };

  const mutation = useMutation({
    mutationKey: [data ? "update_clinic" : "add_clinic", data?.id],
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      values.pictures =
        clinicImageFiles.length > 0 ? clinicImageFiles : data?.pictures || [];
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
    mutation.mutate(values);
  };

  // Track which treatment index is being confirmed for deletion
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const confirmRemoveTreatment = (index: number) => {
    const treatment = form.getValues(`treatments.${index}`);
    if (treatment.action === "old") {
      // Existing treatment: mark as deleted
      update(index, { ...treatment, action: "deleted" });
    } else {
      // New treatment: remove from array
      remove(index);
    }
  };

  // For custom day_of_week input
  const [customDayIdx, setCustomDayIdx] = React.useState<number | null>(null);

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
              <div className="flex flex-col gap-5 w-full">
                <FormInput
                  control={form.control}
                  name="clinic_name"
                  label="병원 이름" // Clinic Name
                  placeholder="여기에 병원 이름을 입력하세요." // Enter clinic name here
                />
                <FormInput
                  control={form.control}
                  name="link"
                  label="클리닉 링크" // Clinic Link
                  placeholder="여기에 클리닉 링크를 입력하세요." // Enter clinic link here
                  type="url"
                />
                <FormContactNumber
                  control={form.control}
                  name="contact_number"
                  label="연락처" // Contact Number
                  placeholder="연락처를 입력하세요." // Enter contact number here
                />
                <FormAddress
                  control={form.control}
                  name="location"
                  label="위치" // Location
                />
                <FormAddress
                  control={form.control}
                  name="region"
                  label="지역" // Region
                />
                <FormDatePicker
                  control={form.control}
                  name="opening_date"
                  label="개원일" // Opening Date
                />
                {/* 병원 이미지 (Clinic Images) */}
                <div>
                  <FormLabel>병원 이미지</FormLabel> {/* Clinic Images */}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleClinicImagesChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {clinicImagePreviews.map((src, idx) => (
                      <Image
                        key={idx}
                        src={src}
                        alt={`clinic-img-${idx}`}
                        width={80}
                        height={80}
                        className="rounded object-cover"
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* 진료 항목 (Treatments Section) */}
              <div className="flex flex-col w-full max-w-xl">
                <div className="font-semibold mb-2">진료 항목</div>{" "}
                {/* Treatments */}
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    아직 추가된 진료 항목이 없습니다. 플러스 아이콘을 클릭하여
                    진료 항목을 추가하세요.
                    {/* No treatments added yet. Click the plus icon to add a treatment. */}
                  </p>
                )}
                {fields
                  .filter((filterT) => filterT.action !== "deleted")
                  .map((item, index) => (
                    <section
                      key={item.id + index}
                      className="relative grid grid-cols-2 gap-3 items-stretch w-full border rounded-md p-4 mb-2"
                    >
                      {/* 오른쪽 상단 삭제 버튼 (Delete button at top right) */}
                      <Button
                        className="absolute top-2 right-2 text-white bg-red-500 p-2 h-8 w-8"
                        type="button"
                        onClick={() => setDeleteIndex(index)}
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
                            name={`treatments.${index}.treatment_id`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>진료명</FormLabel> {/* Treatment */}
                                <Combobox
                                  value={field.value}
                                  onValueChange={(e) => {
                                    field.onChange(e);
                                    const selected = allTreatments?.data.find(
                                      (t) => t.id === e
                                    );
                                    if (selected) {
                                      form.setValue(
                                        `treatments.${index}.treatment_name`,
                                        selected.treatment_name
                                      );
                                      form.setValue(
                                        `treatments.${index}.image_url`,
                                        selected.image_url || ""
                                      );
                                    }
                                    const currentTreatments =
                                      form.getValues("treatments");
                                    currentTreatments.forEach((t, idx) => {
                                      if (
                                        idx !== index &&
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
                                            idx !== index &&
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
                                            .includes(inputValue.toLowerCase()))
                                      );
                                    })
                                  }
                                >
                                  <ComboboxInput
                                    placeholder="진료 항목을 선택하세요..."
                                    className="cursor-pointer"
                                    disabled={
                                      form.getValues(
                                        `treatments.${index}.action`
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
                        <FormField
                          control={form.control}
                          name={`treatments.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>가격</FormLabel> {/* Price */}
                              <FormControl>
                                <Input
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    const currentTreatment = form.getValues(
                                      `treatments.${index}.action`
                                    );
                                    if (currentTreatment === "old") {
                                      form.setValue(
                                        `treatments.${index}.action`,
                                        "updated"
                                      );
                                    }
                                  }}
                                  type="number"
                                  className="w-full h-[45px]"
                                  placeholder="가격을 입력하세요."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* 오른쪽: 이미지 (Right: Image) */}
                      <div className="flex flex-col gap-2 items-center h-full justify-between">
                        <FormField
                          control={form.control}
                          name={`treatments.${index}.image_url`}
                          render={() => (
                            <FormItem className="h-full flex flex-col justify-between">
                              <FormLabel>이미지</FormLabel> {/* Image */}
                              <FormControl>
                                <div className="flex flex-col h-full justify-between">
                                  {(form.getValues(
                                    `treatments.${index}.image_url`
                                  ) &&
                                    typeof form.getValues(
                                      `treatments.${index}.image_url`
                                    ) !== "string" &&
                                    imagePreviews.current[index] && (
                                      <Image
                                        src={imagePreviews.current[index]}
                                        alt="미리보기"
                                        width={140}
                                        height={140}
                                        className="mt-2 w-full h-[92px] object-cover rounded"
                                      />
                                    )) ||
                                    (typeof form.getValues(
                                      `treatments.${index}.image_url`
                                    ) === "string" &&
                                      form.getValues(
                                        `treatments.${index}.image_url`
                                      ) && (
                                        <Image
                                          src={
                                            form.getValues(
                                              `treatments.${index}.image_url`
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
                      <ConfirmDeleteModal
                        title="진료 항목 삭제 확인" // Confirm Remove Treatment
                        description={`정말로 ${item.treatment_name} 항목을 삭제하시겠습니까?`} // Are you sure you want to remove ...
                        open={deleteIndex === index}
                        onCancel={() => setDeleteIndex(null)}
                        onConfirm={() => {
                          setDeleteIndex(null);
                          confirmRemoveTreatment(index);
                        }}
                      />
                    </section>
                  ))}
                <Button
                  type="button"
                  className="w-full mt-4"
                  disabled={mutation.status === "pending"}
                  onClick={() =>
                    append({
                      treatment_id: "",
                      treatment_name: "",
                      image_url: "",
                      price: 0,
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
                    const dayValue = form.watch(
                      `clinic_hours.${index}.day_of_week`
                    );
                    const isCustom =
                      dayValue &&
                      !DAYS_OF_WEEK.includes(dayValue) &&
                      dayValue !== "";
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
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                        {/* 요일 선택 (Day of Week Select with custom option) */}
                        <section className=" w-full flex flex-col gap-2">
                          <FormField
                            control={form.control}
                            name={`clinic_hours.${index}.day_of_week`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-[16px] font-pretendard-600">
                                  요일
                                </FormLabel>{" "}
                                {/* Day */}
                                <Select
                                  value={
                                    DAYS_OF_WEEK.includes(field.value)
                                      ? field.value
                                      : "other"
                                  }
                                  onValueChange={(val) => {
                                    if (val === "other") {
                                      setCustomDayIdx(index);
                                      field.onChange("");
                                    } else {
                                      setCustomDayIdx(null);
                                      field.onChange(val);
                                    }
                                  }}
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
                                    <SelectItem
                                      value="other"
                                      className="cursor-pointer"
                                    >
                                      기타 (직접 입력)
                                    </SelectItem>{" "}
                                    {/* Other (custom) */}
                                  </SelectContent>
                                </Select>
                                {/* '기타' 선택 시 직접 입력 (Show custom input if 'Other' is selected) */}
                                {(customDayIdx === index || isCustom) && (
                                  <Input
                                    className="mt-2"
                                    placeholder="직접 입력 (예: 점심시간)" // Enter custom day (e.g. Lunch Break)
                                    value={field.value}
                                    onChange={(e) =>
                                      field.onChange(e.target.value)
                                    }
                                  />
                                )}
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
                          />
                        </section>

                        {/* 비고 (Note) */}
                        <FormTextarea
                          formItemClassName="row-span-2 flex flex-col"
                          inputClassName="flex-1"
                          control={form.control}
                          name={`clinic_hours.${index}.note`}
                          label="비고" // Note
                          placeholder="예: 점심시간 없음" // e.g. No lunch break
                        />
                      </section>
                    );
                  })}
                  <Button
                    type="button"
                    className="w-full mt-4"
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
 * Handles updating a clinic, including deleting old images, uploading new ones, and updating treatments and working hours.
 */
async function updateClinicWithImages(
  values: z.infer<typeof formSchema>,
  clinicId: string,
  setProgress?: (prog: string | null) => void
) {
  // Check if there are any new images to upload (at least one File in the array)
  const hasNewImages =
    Array.isArray(values.pictures) &&
    values.pictures.some((img) => img instanceof File);

  let clinicPictures: string[] = [];

  if (hasNewImages) {
    // Remove old images
    const { data: clinic } = await supabaseClient
      .from("clinic")
      .select("pictures")
      .eq("id", clinicId)
      .single();

    if (clinic?.pictures && clinic.pictures.length > 0) {
      for (let idx = 0; idx < clinic.pictures.length; idx++) {
        const pic = clinic.pictures[idx];
        await deleteFileFromSupabase(pic, {
          bucket: CLINIC_IMAGE_BUCKET,
        });
      }
    }

    // Upload new images (replace all)
    for (let i = 0; i < values.pictures.length; i++) {
      const file = values.pictures[i];
      if (file instanceof File) {
        setProgress?.("클리닉 이미지 업로드 중: " + (i + 1));
        const publicUrl = await uploadFileToSupabase(file, {
          bucket: CLINIC_IMAGE_BUCKET,
          allowedMimeTypes: CLINIC_IMAGE_ALLOWED_MIME_TYPES,
          maxSizeMB: CLINIC_IMAGE_MAX_FILE_SIZE_MB,
        });
        clinicPictures.push(publicUrl);
      } else if (typeof file === "string") {
        // If the image is already a URL, keep it
        clinicPictures.push(file);
      }
    }
    setProgress?.(null);
  } else {
    // No new images, keep the existing ones
    const { data: clinic } = await supabaseClient
      .from("clinic")
      .select("pictures")
      .eq("id", clinicId)
      .single();
    clinicPictures = clinic?.pictures || [];
  }

  // Update clinic (with new or existing images)
  const clinicPayload = {
    ...values,
    link: values.link || "",
    pictures: clinicPictures,
    opening_date: values.opening_date.toDateString(),
  };

  setProgress?.("병원 업데이트 중...");
  await updateClinic(clinicId, clinicPayload, clinicPictures);

  // Save working hours
  setProgress?.("진료시간 저장 중...");
  if (values.clinic_hours && values.clinic_hours.length > 0) {
    await deleteClinicWorkingHours(clinicId);
    await insertClinicWorkingHours(clinicId, values.clinic_hours);
  } else {
    await deleteClinicWorkingHours(clinicId);
  }

  // Save treatments
  setProgress?.("트리트먼트 저장 중...");
  await saveTreatmentsForClinic(values.treatments, clinicId);
}

/**
 * Handles adding a new clinic, uploading images, and saving treatments and working hours.
 */
async function addClinicWithImages(
  values: z.infer<typeof formSchema>,
  setProgress?: (prog: string | null) => void
) {
  // Upload images
  const clinicPictures: string[] = [];
  for (let i = 0; i < values.pictures.length; i++) {
    const file = values.pictures[i] as File;
    if (setProgress) setProgress("클리닉 이미지 업로드 중: " + (i + 1));
    const publicUrl = await uploadFileToSupabase(file, {
      bucket: CLINIC_IMAGE_BUCKET,
      allowedMimeTypes: CLINIC_IMAGE_ALLOWED_MIME_TYPES,
      maxSizeMB: CLINIC_IMAGE_MAX_FILE_SIZE_MB,
    });
    clinicPictures.push(publicUrl);
  }
  if (setProgress) setProgress(null);

  // Create clinic
  const clinicPayload = {
    ...values,
    link: values.link || "",
    pictures: clinicPictures,
    opening_date: values.opening_date.toDateString(),
  };
  const newClinicId = await insertClinic(clinicPayload, clinicPictures);

  // Save working hours
  if (values.clinic_hours && values.clinic_hours.length > 0) {
    await insertClinicWorkingHours(newClinicId, values.clinic_hours);
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
      await insertClinicTreatment(clinicId, t.treatment_id, t.price);
    } else if ((t.action === "updated" || !t.action) && t.treatment_id) {
      await updateClinicTreatment(clinicId, t.treatment_id, t.price);
    }
    // else: skip
  }
  if (setUploadingFileIndex) setUploadingFileIndex(null);
}
