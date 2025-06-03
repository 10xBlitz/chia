"use client";

import { useState } from "react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  insertTreatment,
  updateTreatment,
} from "@/lib/supabase/services/treatments.services";
import { TreatmentTable } from "./columns";
import Image from "next/image";

const formSchema = z
  .object({
    id: z.string().optional(),
    treatment_name: z.string().min(1, "Treatment name is required"),
    image_url: z.any(),
  })
  .refine(
    (values) =>
      typeof values.image_url === "string" ||
      values.image_url instanceof File ||
      values.image_url === undefined ||
      values.image_url === null ||
      (Array.isArray(values.image_url) && values.image_url.length === 0),
    {
      message: "Image is required",
      path: ["image_url"],
    }
  )
  .refine(
    (values) =>
      !values.image_url ||
      typeof values.image_url === "string" ||
      (values.image_url instanceof File &&
        values.image_url.type.startsWith("image/")),
    {
      message: "File must be an image",
      path: ["image_url"],
    }
  );

export const TreatmentModal = ({
  data,
  open,
  onClose,
  onSuccess,
}: {
  data?: TreatmentTable;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    data?.image_url || ""
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: data
      ? {
          id: data.id,
          treatment_name: data.treatment_name,
          image_url: data.image_url || "",
        }
      : {
          treatment_name: "",
          image_url: "",
        },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // If a new file is selected, pass it to the API, else use the string
      const imageValue = imageFile ? imageFile : values.image_url;
      if (values.id) {
        await updateTreatment(values.id, {
          treatment_name: values.treatment_name,
          image_url: imageValue,
        });
      } else {
        await insertTreatment({
          treatment_name: values.treatment_name,
          image_url: imageValue,
        });
      }
    },
    onSuccess: () => {
      toast.success(data ? "Treatment updated" : "Treatment created");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
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

  return (
    <Modal
      title={data ? "Edit Treatment" : "Add Treatment"}
      description={data ? "Edit the treatment" : "Add a new treatment"}
      isOpen={open}
      isLong={false}
      onClose={onClose}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="py-2 flex flex-col gap-5"
        >
          <FormField
            control={form.control}
            name="treatment_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Treatment Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter treatment name"
                    className="h-[45px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, field.onChange)}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <Image
                          src={imagePreview}
                          alt="Preview"
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
              {data ? "Save Changes" : "Add Treatment"}
              {mutation.status === "pending" && " Loading..."}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
};
