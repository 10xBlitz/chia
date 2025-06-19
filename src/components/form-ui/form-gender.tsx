import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import GenderSelector from "../gender-selector";

type FormGenderProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  formItemClassName?: string;
  formLabelClassName?: string;
};

/**
 * FormGender - A reusable gender selector form field component for React Hook Form.
 *
 * @example
 * // In your form component:
 * import { useForm } from "react-hook-form";
 * import { Form } from "../ui/form";
 * import FormGender from "@/components/form-ui/form-gender";
 *
 * const form = useForm();
 *
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <FormGender
 *         control={form.control}
 *         name="gender"
 *         label="성별" // Gender
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
 * @param label - The label for the gender selector (string)
 * @param formItemClassName - Custom class for the FormItem
 * @param formLabelClassName - Custom class for the FormLabel
 */

export default function FormGender<T extends FieldValues>({
  control,
  name,
  label,
  formItemClassName,
  formLabelClassName,
}: FormGenderProps<T>) {
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
            <GenderSelector
              onValueChange={field.onChange}
              value={field.value}
              disabled={field.disabled} // Set to true if you want to disable the selector
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
