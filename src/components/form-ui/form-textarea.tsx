/**
 * FormTextarea - A reusable textarea form field component for React Hook Form.
 *
 * @example
 * // In your form component:
 * import { useForm } from "react-hook-form";
 * import { Form } from "../ui/form";
 * import FormTextarea from "@/components/form-ui/form-textarea";
 *
 * const form = useForm();
 *
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <FormTextarea
 *         control={form.control}
 *         name="concern"
 *         label="고민/요청사항" // Concern/Request
 *         placeholder="고민이나 요청사항을 입력해주세요." // Please enter your concern or request
 *         maxLength={500}
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
 * @param label - The label for the textarea (string)
 * @param disabled - Whether the textarea is disabled
 * @param maxLength - Maximum allowed characters
 * @param placeholder - Placeholder text
 * @param formItemClassName - Custom class for the FormItem
 * @param formLabelClassName - Custom class for the FormLabel
 * @param formControlClassName - Custom class for the FormControl
 * @param inputClassName - Custom class for the Textarea input
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
import { Textarea } from "../ui/textarea";

type FormTextareaProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  formItemClassName?: string;
  formLabelClassName?: string;
  formControlClassName?: string;
  inputClassName?: string;
};

export default function FormTextarea<T extends FieldValues>({
  control,
  name,
  label,
  maxLength = 1000, // Default max length
  disabled = false,
  placeholder,
  formItemClassName,
  formLabelClassName,
  formControlClassName,
  inputClassName,
}: FormTextareaProps<T>) {
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
          <FormControl className={formControlClassName}>
            <Textarea
              className={cn("h-[45px]", inputClassName)}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          <div className="text-right text-xs text-gray-400 mt-1">
            {field.value?.length || 0}/{maxLength}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
