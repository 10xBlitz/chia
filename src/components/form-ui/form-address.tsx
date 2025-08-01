import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import AddressSelector from "../address-selector";

/**
 * FormAddress - A reusable address selector form field component for React Hook Form.
 *
 * @example
 * // In your form component:
 * import { useForm } from "react-hook-form";
 * import { Form } from "../ui/form";
 * import FormAddress from "@/components/form-ui/form-address";
 *
 * const form = useForm();
 *
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <FormAddress
 *         control={form.control}
 *         name="region"
 *         label="지역" // Region
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
 * @param label - The label for the address selector (string)
 * @param formItemClassName - Custom class for the FormItem
 * @param formLabelClassName - Custom class for the FormLabel
 */

type FormAddressProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  formItemClassName?: string;
  formLabelClassName?: string;
  inputClassName?: string; // Optional class for the AddressSelector input
};

export default function FormAddress<T extends FieldValues>({
  control,
  name,
  label,
  formItemClassName,
  formLabelClassName,
  inputClassName,
}: FormAddressProps<T>) {
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
            <AddressSelector
              onAddressSelect={(city, region) =>
                field.onChange(`${city},${region}`)
              }
              initialCity={field.value?.split(",")[0] || ""}
              initialRegion={field.value?.split(",")[1] || ""}
              className={inputClassName}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
