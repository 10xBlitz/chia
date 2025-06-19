/**
 * FormTimePicker - A reusable time picker form field component for React Hook Form.
 *
 * @example
 * // In your form component:
 * import { useForm } from "react-hook-form";
 * import { Form } from "../ui/form";
 * import FormTimePicker from "@/components/form-ui/form-time";
 *
 * const form = useForm();
 *
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <FormTimePicker
 *         control={form.control}
 *         name="appointment_time"
 *         label="예약 시간" // Appointment Time
 *       />
 *       // ...other fields and submit button...
 *     </form>
 *   </Form>
 * );
 *
 * @see {@link src/app/patient/quotation/create-quotation/page.tsx} for a full usage example
 *
 * @param control - The react-hook-form control object
 * @param name - The field name (string)
 * @param label - The label for the time picker (string)
 * @param disabled - Whether the time picker is disabled
 * @param formItemClassName - Custom class for the FormItem
 * @param formLabelClassName - Custom class for the FormLabel
 * @param inputClassName - Custom class for the time picker input
 */

import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import { KoreanTimePicker } from "../time-picker";

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
  formItemClassName?: string;
  formLabelClassName?: string;
  inputClassName?: string;
};

export default function FormTimePicker<T extends FieldValues>({
  control,
  name,
  label,
  disabled = false,
  formItemClassName,
  formLabelClassName,
  inputClassName,
}: FormInputProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={formItemClassName}>
          <FormLabel
            className={cn(
              "text-[16px] font-pretendard-600",
              formLabelClassName
            )}
          >
            {label}
          </FormLabel>
          <FormControl>
            <div className="relative">
              <KoreanTimePicker
                disabled={disabled}
                className={inputClassName}
                time={field.value}
                setSelected={field.onChange}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
