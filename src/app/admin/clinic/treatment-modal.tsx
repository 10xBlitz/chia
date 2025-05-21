"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlusSquareIcon, Trash2Icon } from "lucide-react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { ClinicTable } from "./columns";

const formSchema = z.object({
  treatments: z.array(
    z.object({
      treatment_id: z.string().nullable(),
      treatment_name: z.string().min(1),
      image_url: z.string().nullable(),
    })
  ),
});

export const TreatmentModal = ({
  data,
  open,
  onClose,
}: {
  data?: ClinicTable;
  open: boolean;
  onClose: () => void;
}) => {
  // const [loading, setLoading] = useState(false);
  // const router = useRouter();

  const title = data ? `Edit ${data.clinic_name}` : "Add category ";
  const description = data
    ? `Edit the treatments of selected clinic`
    : `Add treatments   `;
  const buttonText = data ? "Save Changes" : "Add Treatments ";
  // const message = data
  //   ? "Treatment/s edited successfully"
  //   : "Treatment/s added successfully";

  console.log({ data });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      treatments:
        data?.clinic_treatment.map((item) => ({
          treatment_id: item.treatment.id.toString(),
          treatment_name: item.treatment.treatment_name,
          image_url: item.treatment.image_url,
        })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "treatments",
  });

  // const onSubmit = async (values: z.infer<typeof formSchema>) => {
  //   console.log({ values });
  //   try {
  //     setLoading(true);
  //     if (data) {
  //       await axios.patch(
  //         `/protected/store-owner/category/api/update-category/${data.id}`,
  //         values
  //       );
  //     } else {
  //       await axios.post(
  //         "/protected/store-owner/category/api/add-category",
  //         values
  //       );
  //     }
  //     toast.success(message);
  //     router.refresh();
  //     onClose();
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   } catch (error: any) {
  //     if (axios.isAxiosError(error)) {
  //       toast.error(
  //         `Error: ${error.response?.status} - ${error.response?.data.message}`
  //       );
  //       console.log(error.response?.data.message);
  //     } else {
  //       // Handle other error types if necessary
  //       toast.error("Something went wrong.");
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <Modal
      title={title}
      description={description}
      isOpen={open}
      isLong={true}
      onClose={() => {
        onClose();
      }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => {})} className="py-2">
          <div className="flex flex-col gap-5 w-full items-center justify-center ">
            {fields.length === 0 && (
              <p className="text-sm -mt-5 text-muted-foreground">
                No treatments added yet. Click the plus icon to add a treatment.
              </p>
            )}

            {fields.map((item, index) => {
              return (
                <section
                  key={item.id + index}
                  className="grid grid-cols-5 gap-3 items-end w-full "
                >
                  <FormField
                    control={form.control}
                    name={`treatments.${index}.treatment_name`}
                    render={({ field }) => (
                      <FormItem className=" col-span-4">
                        <FormLabel> Treatment Name </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value}
                            className="w-full"
                            placeholder="Enter treatment name here"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    className="  text-white bg-red-500 col-span-1"
                    type="button"
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </section>
              );
            })}
            <Button
              type="button"
              className="w-full mt-4"
              onClick={() =>
                append({
                  treatment_id: "",
                  treatment_name: "",
                  image_url: "",
                })
              }
            >
              <PlusSquareIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="pt-4 space-x-2 flex items-center justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="w-full">
                  <p className="w-full bg-black/50 py-2 rounded-md text-white">
                    {buttonText}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </form>
      </Form>
    </Modal>
  );
};
