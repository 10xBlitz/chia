"use client";

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

import { CheckIcon, PlusSquareIcon, Trash2Icon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { ClinicTable } from "./columns";
import { supabaseClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import AddressSelector from "@/components/address-selector";
import { KoreanDatePicker } from "@/components/date-picker-v2";
import { PhoneInput } from "@/components/phone-input";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
} from "@/components/ui/combobox";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { getPaginatedTreatments } from "@/lib/supabase/services/treatments.services";
import { ConfirmDeleteModal } from "@/components/confirm-modal";
import {
  insertClinic,
  removeClinicImagesFromStorage,
  updateClinic,
  uploadClinicImages,
} from "@/lib/supabase/services/clinics.services";
import {
  insertClinicTreatment,
  markClinicTreatmentDeleted,
  updateClinicTreatment,
} from "@/lib/supabase/services/clinic-treatments.service";

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
  const [confirmModal, setConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingFileIndex, setUploadingFileIndex] = useState<number | null>(
    null
  );
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

  const title = data ? `Edit ${data.clinic_name}` : "Add Clinic";
  const description = data
    ? `Edit the clinic and its treatments`
    : `Add a new clinic and treatments`;
  const buttonText = data ? "Save Changes" : "Add Clinic";

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
        }
      : {
          clinic_name: "",
          contact_number: "",
          location: "",
          link: "",
          region: "",
          opening_date: new Date(),
          treatments: [],
        },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "treatments",
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
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Attach pictures to values
      values.pictures =
        clinicImageFiles.length > 0 ? clinicImageFiles : data?.pictures || [];
      return upsertClinicAndTreatments(values, data?.id, setUploadingFileIndex);
    },
    onSuccess: () => {
      setLoading(false);
      setUploadingFileIndex(null);
      toast.success(data ? "Clinic updated" : "Clinic created");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      setLoading(false);
      setUploadingFileIndex(null);
      toast.error(error.message || "Something went wrong.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    mutation.mutate(values);
  };

  const confirmRemoveTreatment = (index: number) => {
    const treatment = form.getValues(`treatments.${index}`);
    if (treatment.treatment_id) {
      // Existing treatment: mark as deleted
      update(index, { ...treatment, action: "deleted" });
    } else {
      // New treatment: remove from array
      remove(index);
    }
  };

  return (
    <>
      <Modal
        title={title}
        description={description}
        isOpen={open}
        isLong={true}
        onClose={onClose}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="py-2">
            {typeof uploadingFileIndex === "number" &&
              clinicImageFiles.length > 0 && (
                <div className="w-full text-center text-blue-600 text-sm mb-2">
                  병원 이미지 업로드 중... 파일 {uploadingFileIndex + 1} /{" "}
                  {clinicImageFiles.length}
                </div>
              )}
            <div className="flex flex-col gap-8 w-full items-start justify-center">
              {/* Left: Clinic Info */}
              <div className="flex flex-col gap-5 w-full">
                <FormField
                  control={form.control}
                  name="clinic_name"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Clinic Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter clinic name"
                          className="h-[45px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Clinic Link</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter link name"
                          className="h-[45px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_number"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <PhoneInput
                          defaultCountry="KR"
                          onChange={field.onChange}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <AddressSelector
                          onAddressSelect={(city, region) =>
                            field.onChange(`${city},${region}`)
                          }
                          initialCity={field.value.split(",")[0]}
                          initialRegion={field.value.split(",")[1]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Region</FormLabel>
                      <FormControl>
                        <AddressSelector
                          onAddressSelect={(city, region) =>
                            field.onChange(`${city},${region}`)
                          }
                          initialCity={field.value.split(",")[0]}
                          initialRegion={field.value.split(",")[1]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="opening_date"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Opening Date</FormLabel>
                      <FormControl>
                        <KoreanDatePicker
                          value={field.value}
                          onChange={(e) => field.onChange(e)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Clinic Images */}
                <div>
                  <FormLabel>Clinic Images</FormLabel>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleClinicImagesChange}
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
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
              {/* Right: Treatments */}
              <div className="flex flex-col w-full max-w-xl">
                <div className="font-semibold mb-2">Treatments</div>
                {fields.length === 0 && (
                  <p className="text-sm  text-muted-foreground">
                    No treatments added yet. Click the plus icon to add a
                    treatment.
                  </p>
                )}
                {fields
                  .filter((filterT) => filterT.action !== "deleted")
                  .map((item, index) => (
                    <section
                      key={item.id + index}
                      className="relative grid grid-cols-2 gap-3 items-stretch w-full border rounded-md p-4 mb-2"
                    >
                      {/* Delete button at top right */}
                      <Button
                        className="absolute top-2 right-2 text-white bg-red-500 p-2 h-8 w-8"
                        type="button"
                        onClick={() => setConfirmModal(true)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                      {/* Left: Treatment Name (select) and Price (stacked) */}
                      <div className="flex flex-col gap-2 justify-between h-full">
                        {treatmentsLoading ? (
                          <div>Loading...</div>
                        ) : (
                          <FormField
                            control={form.control}
                            name={`treatments.${index}.treatment_id`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Treatment</FormLabel>
                                <Combobox
                                  value={field.value}
                                  onValueChange={(e) => {
                                    field.onChange(e);
                                    // Set image_url and treatment_name when treatment is selected
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
                                  }}
                                  filterItems={(inputValue, items) =>
                                    items.filter(({ value }) => {
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
                                    placeholder="Pick a treatment..."
                                    className="cursor-pointer"
                                    disabled={
                                      form.getValues(
                                        `treatments.${index}.action`
                                      ) === "old"
                                    }
                                  />
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
                                            {/* Show treatment image in dropdown */}
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
                                    <ComboboxEmpty>No results.</ComboboxEmpty>
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
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    form.setValue(
                                      `treatments.${index}.action`,
                                      "updated"
                                    );
                                  }}
                                  type="number"
                                  className="w-full h-[45px]"
                                  placeholder="Enter price"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Right: Image */}
                      <div className="flex flex-col gap-2 items-center h-full justify-between">
                        <FormField
                          control={form.control}
                          name={`treatments.${index}.image_url`}
                          render={() => (
                            <FormItem className="h-full flex flex-col justify-between">
                              <FormLabel>Image</FormLabel>
                              <FormControl>
                                <div className="flex flex-col h-full justify-between">
                                  {/* Only show preview, no input */}
                                  {(form.getValues(
                                    `treatments.${index}.image_url`
                                  ) &&
                                    typeof form.getValues(
                                      `treatments.${index}.image_url`
                                    ) !== "string" &&
                                    imagePreviews.current[index] && (
                                      <Image
                                        src={imagePreviews.current[index]}
                                        alt="Preview"
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
                                          alt="Preview"
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
                        title="Confirm Remove Treatment"
                        description={`Are you sure you want to remove ${item.treatment_name}?`}
                        open={confirmModal}
                        onCancel={() => setConfirmModal(false)}
                        onConfirm={() => {
                          setConfirmModal(false);
                          confirmRemoveTreatment(index);
                        }}
                      />
                    </section>
                  ))}
                <Button
                  type="button"
                  className="w-full mt-4"
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
                  <PlusSquareIcon className="h-4 w-4" /> Add Treatment
                </Button>
              </div>
            </div>
            <div className="pt-4 space-x-2 flex items-center justify-end">
              <Button type="submit" className="w-full" disabled={loading}>
                {buttonText}
              </Button>
            </div>
          </form>
        </Form>
      </Modal>
    </>
  );
};

/**
 * Upserts a clinic and its treatments.
 * Handles image upload, clinic creation or update, and treatments upsert.
 * If updating and new images are provided, removes old images from storage.
 *
 * @param values - Clinic form values including treatments and pictures.
 * @param clinicId - Optional clinic ID for update (if not provided, creates new).
 * @param setUploadingFileIndex - Optional callback to set uploading file index for UI feedback.
 * @returns Promise resolving to { success: true } on completion.
 */
async function upsertClinicAndTreatments(
  values: z.infer<typeof formSchema>,
  clinicId?: string,
  setUploadingFileIndex?: (idx: number | null) => void
) {
  let newClinicId = clinicId;
  let clinicPictures: string[] = [];
  // Upload clinic images if any
  if (
    Array.isArray(values.pictures) &&
    values.pictures.length > 0 &&
    values.pictures[0] instanceof File
  ) {
    // If updating, remove old images from storage
    if (
      clinicId &&
      Array.isArray(values.pictures) &&
      values.pictures.length > 0
    ) {
      // Fetch current pictures from DB
      const { data: clinic } = await supabaseClient
        .from("clinic")
        .select("pictures")
        .eq("id", clinicId)
        .single();
      if (clinic?.pictures && clinic.pictures.length > 0) {
        await removeClinicImagesFromStorage(clinic.pictures);
      }
    }
    clinicPictures = await uploadClinicImages(
      values.pictures as File[],
      newClinicId || "temp",
      setUploadingFileIndex
    );
  } else if (Array.isArray(values.pictures)) {
    clinicPictures = values.pictures as string[];
  }
  if (newClinicId) {
    await updateClinic(
      newClinicId,
      {
        ...values,
        link: values.link || "",
        pictures: values.pictures ? values.pictures : [],
        opening_date: values.opening_date.toDateString(),
      },
      clinicPictures
    );
  } else {
    newClinicId = await insertClinic(
      {
        ...values,
        link: values.link || "",
        pictures: values.pictures ? values.pictures : [],
        opening_date: values.opening_date.toDateString(),
      },
      clinicPictures
    );
  }

  await upsertTreatmentsForClinic(values.treatments, newClinicId);
  return { success: true };
}

/**
 * Upserts treatments for a clinic.
 * Handles inserting, updating, or marking treatments as deleted based on their action.
 *
 * @param treatments - Array of treatment objects with action flags.
 * @param clinicId - The clinic ID to associate treatments with.
 * @param setUploadingFileIndex - Optional callback to set uploading file index for UI feedback.
 */
async function upsertTreatmentsForClinic(
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
