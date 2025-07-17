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
import FormInput from "@/components/form-ui/form-input";
import { treatmentModalFormSchema } from "./treatment-modal.types";

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
  const [progress, setProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<z.infer<typeof treatmentModalFormSchema>>({
    resolver: zodResolver(treatmentModalFormSchema),
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
    mutationFn: async (values: z.infer<typeof treatmentModalFormSchema>) => {
      // If a new file is selected, pass it to the API, else use the string
      const imageValue = imageFile ? imageFile : values.image_url;
      if (values.id) {
        await updateTreatment(values.id, {
          treatment_name: values.treatment_name,
          image_url: imageValue,
        });
      } else {
        await insertTreatment(
          {
            treatment_name: values.treatment_name,
            image_url: imageValue,
          },
          (prog) => setProgress(prog)
        );
      }
    },
    onSuccess: () => {
      toast.success(data ? "Treatment updated" : "Treatment created");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong.");
      setProgress(null);
    },
  });

  const onSubmit = (values: z.infer<typeof treatmentModalFormSchema>) => {
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
  const inputClassName = "text-sm sm:text-[16px] h-[40px] sm:h-[45px]";
  const formLabelClassName = "text-sm sm:text-[16px]";
  return (
    <Modal
      title={data ? "치료 편집" : "치료 추가"} // "Edit Treatment" or "Add Treatment"
      description={""}
      isOpen={open}
      onClose={onClose}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="py-2 flex flex-col gap-5"
        >
          <FormInput
            control={form.control}
            name="treatment_name"
            label="치료명" // "Treatment Name"
            placeholder="여기에 치료 이름을 입력하세요" // "Enter treatment name here"
            formLabelClassName={formLabelClassName}
            inputClassName={inputClassName}
          />
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이미지</FormLabel> {/* Image */}
                <FormControl>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="treatment-image-upload"
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
              {data ? "변경 사항 저장" : "치료 추가"}
              {/* "Save Changes" or "Add Treatment" */}
              {progress}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
};
