"use client";

import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useQuery } from "@tanstack/react-query";
import { getPaginatedUsers } from "@/lib/supabase/services/users.services";
import { SelectItem } from "@radix-ui/react-select";

type FormSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
  placeholder?: string;
  formLabelClassName?: string;
  loading?: boolean;
  clinicId: string;
};

/**
 * FormDentistsDropdown - A reusable select dropdown form field for choosing a dentist in a clinic, integrated with React Hook Form.
 *
 * This component fetches all active dentists for the given clinic using TanStack Query and displays them as selectable options.
 * It is designed to be used inside a React Hook Form form, and will bind the selected dentist's user ID to the specified field.
 *
 * - Fetches dentists using TanStack Query and Supabase service.
 * - Shows loading and error states.
 * - Fully controlled by React Hook Form.
 * - Accessible and customizable.
 *
 * @example
 * import { useForm } from "react-hook-form";
 * import FormDentistsDropdown from "@/components/form-ui/form-dentists-dropdown";
 *
 * const form = useForm();
 *
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <DentistsDropdown
 *         control={form.control}
 *         name="notification_recipient_user_id"
 *         label="치과의사" // Dentist
 *         placeholder="치과의사를 선택하세요" // Please select a dentist
 *         clinicId={clinicId}
 *       />
 *     </form>
 *   </Form>
 * );
 *
 * @param control - The react-hook-form control object
 * @param name - The field name (string)
 * @param label - The label for the select (string)
 * @param placeholder - Placeholder text
 * @param clinicId - The clinic ID to fetch dentists for
 * @param formLabelClassName - Custom class for the FormLabel
 * @param disabled - Whether the select is disabled
 */

export default function FormDentistsDropdown<T extends FieldValues>({
  control,
  name,
  label,
  disabled = false,
  placeholder,
  formLabelClassName,
  clinicId,
}: FormSelectProps<T>) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["dentists-by-clinic", "dropdown-form", clinicId],
    queryFn: async () => {
      const { data } = await getPaginatedUsers(1, 1000, {
        clinic_id: clinicId,
        category: "dentist",
      });

      return data || [];
    },
  });

  if (isLoading) {
    //show loading state
    return (
      <FormItem>
        <FormLabel
          className={cn("text-[16px] font-pretendard-600", formLabelClassName)}
        >
          {label}
        </FormLabel>
        <Select>
          <FormControl>
            <SelectTrigger className="w-full min-h-[45px]">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="none" disabled>
              Loading...
            </SelectItem>
          </SelectContent>
        </Select>
      </FormItem>
    );
  }

  if (error) {
    //show error state
    return (
      <FormItem>
        <FormLabel
          className={cn("text-[16px] font-pretendard-600", formLabelClassName)}
        >
          {label}
        </FormLabel>
        <FormControl>
          <SelectTrigger className="w-full min-h-[45px]">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="none" disabled>
            {error.message}
          </SelectItem>
        </SelectContent>
      </FormItem>
    );
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel
            className={cn(
              "text-[16px] font-pretendard-600",
              formLabelClassName
            )}
          >
            {label}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className="w-full min-h-[45px]">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {data?.map((dentist) => (
                <SelectItem
                  className="cursor-pointer hover:bg-accent p-1"
                  key={dentist.id}
                  value={dentist.id}
                >
                  {dentist.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
