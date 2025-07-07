"use client";

import { useEffect, useRef, useState } from "react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useMutation,
  useQuery as useTanstackQuery,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ClinicEventTable } from "./columns";
import Image from "next/image";
import {
  insertClinicEvent,
  updateClinicEvent,
} from "@/lib/supabase/services/clinic-event.services";
import FormInput from "@/components/form-ui/form-input";
import FormTextarea from "@/components/form-ui/form-textarea";
import FormSelect from "@/components/form-ui/form-select";
import { clinicEventFormSchema } from "./clinic-event-modal.types";
import { getPaginatedClinics } from "@/lib/supabase/services/clinics.services";
import { getPaginatedClinicTreatments } from "@/lib/supabase/services/treatments.services";
import { SelectItem } from "@/components/ui/select";
import FormDateRangePicker from "@/components/form-ui/form-date-picker-range";
import { parseDateFromSupabase } from "@/lib/utils";

export const ClinicEventModal = ({
  data,
  open,
  onClose,
  onSuccess,
}: {
  data?: ClinicEventTable;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    data?.image_url || ""
  );
  const [progress, setProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<z.infer<typeof clinicEventFormSchema>>({
    resolver: zodResolver(clinicEventFormSchema),
    defaultValues: data
      ? {
          id: data.id,
          title: data.title,
          description: data.description || "",
          discount: data.discount.toString() || "",
          image: data.image_url || "",
          clinic_id: data.clinic_treatment.clinic.id,
          clinic_treatment_id: data.clinic_treatment_id,
          date_range: parseDateFromSupabase(data.date_range as string) ?? {
            from: new Date(),
            to: new Date(),
          },
        }
      : {
          title: "",
          description: "",
          discount: "0",
          image: "",
          clinic_id: undefined, // Use undefined for unselected
          clinic_treatment_id: undefined, // Use undefined for unselected
          date_range: {
            from: new Date(),
            to: new Date(),
          },
        },
  });

  // Reset form and image state when modal closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setImageFile(null);
      setImagePreview("");
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof clinicEventFormSchema>) => {
      // Convert date_range to ISO strings for Supabase
      const date_range = [
        values.date_range.from.toDateString(),
        values.date_range.to.toDateString(),
      ];

      if (values.id) {
        await updateClinicEvent(
          {
            id: values.id,
            title: values.title,
            description: values.description,
            date_range,
            clinic_treatment_id: values.clinic_treatment_id,
            discount: parseFloat(values.discount),
            image: imageFile ? imageFile : values.image,
          },
          (prog) => setProgress(prog)
        );
      } else {
        await insertClinicEvent(
          {
            title: values.title,
            description: values.description,
            date_range,
            clinic_treatment_id: values.clinic_treatment_id,
            discount: parseFloat(values.discount),
            image: imageFile ? imageFile : values.image,
          },
          (prog) => setProgress(prog)
        );
        // Send push notification to all users after event creation
        // await sendNotificationToAllUsers({
        //   title: `새로운 이벤트가 등록되었습니다: ${values.title}`,
        //   // "A new event has been registered: {title}"
        //   body: values.description || "새로운 병원 이벤트가 등록되었습니다.",
        //   // "A new hospital event has been registered."
        // });
      }
    },
    onSuccess: () => {
      toast.success(
        data ? "병원 이벤트 업데이트" : "병원 이벤트가 생성되었습니다"
      ); // "Clinic event updated" or "Clinic event created"
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong.");
    },
  });

  const onSubmit = (values: z.infer<typeof clinicEventFormSchema>) => {
    mutation.mutate(values);
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldOnChange: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        // Optionally clear the text field value
        fieldOnChange("");
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview("");
      fieldOnChange("");
    }
  };

  // Fetch all clinics
  const { data: clinics } = useTanstackQuery({
    queryKey: ["all_clinics"],
    queryFn: async () => await getPaginatedClinics(1, 1000, {}),
  });

  // Fetch treatments for a selected clinic
  const selectedClinicId = form.watch("clinic_id");
  const { data: treatments } = useTanstackQuery({
    queryKey: ["treatments_by_clinic", selectedClinicId],
    queryFn: async () =>
      await getPaginatedClinicTreatments(selectedClinicId, 1, 1000, {}),
    enabled: !!selectedClinicId || !!form.getValues("clinic_id"),
  });

  return (
    <Modal
      title={data ? "병원 이벤트 편집" : "병원 이벤트 추가"}
      description={""}
      isOpen={open}
      isLong={false}
      onClose={onClose}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="py-2 flex flex-col gap-5"
        >
          {clinics?.data && (
            <FormSelect
              control={form.control}
              name="clinic_id"
              label="병원" // "Hospital"
              placeholder="병원을 선택해주세요." // "Please select a hospital"
            >
              {clinics?.data.map((clinic) => (
                <SelectItem
                  className="cursor-pointer"
                  key={clinic.id}
                  value={clinic.id}
                >
                  {clinic.clinic_name}
                </SelectItem>
              ))}
            </FormSelect>
          )}

          <FormSelect
            control={form.control}
            name="clinic_treatment_id"
            label="치료"
            placeholder="치료를 선택해주세요." // "Please select a treatment"
            disabled={!form.getValues("clinic_id") || !treatments?.data?.length}
          >
            {treatments?.data?.map((treatment) => (
              <SelectItem
                className="cursor-pointer"
                key={treatment.id}
                value={treatment.id}
              >
                {treatment.treatment.treatment_name}
              </SelectItem>
            ))}
          </FormSelect>

          <FormInput
            control={form.control}
            name="title"
            label="이벤트 제목" // "Event Title"
            placeholder="이벤트 제목을 입력해주세요." // "Please enter the event title"
          />

          <FormInput
            control={form.control}
            name="discount"
            type="number"
            label="할인율" // "Discount Rate"
            placeholder="할인율을 입력해주세요." // "Please enter the discount rate"
          />

          <FormDateRangePicker
            control={form.control}
            name="date_range"
            label="기간" // "Period"
          />

          <FormTextarea
            control={form.control}
            name="description"
            label="이벤트 설명" // "Event Description"
            placeholder="이벤트에 대한 설명을 입력해주세요." // "Please enter a description for the event"
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이미지</FormLabel> {/* Image */}
                <FormControl>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="clinic-event-image-upload"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={(e) => handleImageChange(e, field.onChange)}
                    />
                    <div className="flex gap-3 items-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2"
                      >
                        이미지 선택 {/* Select Image */}
                      </Button>
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview("");
                            field.onChange("");
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="text-red-500"
                        >
                          삭제 {/* Delete */}
                        </Button>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="mt-2">
                        <Image
                          src={imagePreview}
                          alt="미리보기" // Preview
                          className="rounded object-cover"
                          width={120}
                          height={120}
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="pt-4 flex items-center justify-end">
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.status === "pending"}
            >
              {data ? "변경 사항 저장" : "이벤트 추가"}
              {/* "Save Changes": "Add Event" */}
              {progress}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
};
