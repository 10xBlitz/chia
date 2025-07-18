import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import { KoreanDatePicker } from "../korean-date-picker-single";

type FormDatePickerProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  formItemClassName?: string;
  formLabelClassName?: string;
  inputClassName?: string; // Optional class for the KoreanDatePicker input
  disabled?: boolean; // Optional prop to disable the date picker
};

/**
 * FormDatePickerSingle - A reusable single date picker form field component for React Hook Form.
 *
 * @example
 * // In your form component:
 * import { useForm } from "react-hook-form";
 * import { Form } from "../ui/form";
 * import FormDatePickerSingle from "@/components/form-ui/form-date-picker-single";
 *
 * const form = useForm();
 *
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <FormDatePickerSingle
 *         control={form.control}
 *         name="birthdate"
 *         label="생년월일" // Birthdate
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
 * @param label - The label for the date picker (string)
 * @param formItemClassName - Custom class for the FormItem
 * @param formLabelClassName - Custom class for the FormLabel
 * @param disabled - Optional prop to disable the date picker
 * @param inputClassName - Optional class for the KoreanDatePicker input
 */

export default function FormDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  formItemClassName,
  formLabelClassName,
  disabled = false,
  inputClassName, // Optional class for the KoreanDatePicker input
}: FormDatePickerProps<T>) {
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
            <KoreanDatePicker
              onChange={field.onChange}
              value={field.value}
              disabled={disabled}
              className={inputClassName}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
