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
import MultipleSelector, { Option } from "../ui/multiple-selector";

/**
 * FormMultiSelect - A reusable multi-select dropdown form field component for React Hook Form.
 *
 * @example
 * // In your form component:
 * import { useForm } from "react-hook-form";
 * import { Form } from "../ui/form";
 * import FormMultiSelect from "@/components/form-ui/form-select-multi";
 *
 * const form = useForm();
 *
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <FormMultiSelect
 *         control={form.control}
 *         name="departments"
 *         label="부서" // Department
 *         options={options}
 *         onChange={handleChange}
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
 * @param label - The label for the multi-select (string)
 * @param options - The options for the multi-select
 * @param onChange - Callback when selection changes
 * @param placeholder - Placeholder text
 * @param formLabelClassName - Custom class for the FormLabel
 * @param loading - Loading state for the options
 * @param emptyIndicator - Custom node to show when no options
 * @param value - The selected value(s)
 */

type FormMultiSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  formLabelClassName?: string;
  options: Option[] | undefined;
  loading?: boolean;
  emptyIndicator?: React.ReactNode;
  onChange: (values: Option[]) => void;
  value?: Option[];
};

export default function FormMultiSelect<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  formLabelClassName,
  options,
  loading,
  onChange,
}: FormMultiSelectProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel
            className={cn(
              "text-[16px] font-pretendard-600",
              formLabelClassName
            )}
          >
            {label}
          </FormLabel>
          <FormControl>
            {loading ? (
              <span className="text-gray-400 text-sm">
                로딩 중입니다... {/**Loading... */}
              </span>
            ) : (
              <MultipleSelector
                selectFirstItem={false}
                defaultOptions={options}
                placeholder={placeholder}
                hidePlaceholderWhenSelected={true}
                onChange={(selected) => {
                  onChange(selected);
                }}
                emptyIndicator={
                  // no results found.
                  <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                    결과가 없습니다.
                  </p>
                }
              />

              //    <MultipleSelector
              //           selectFirstItem={false}
              //           defaultOptions={departments?.map((item) => ({
              //             label: item.department_name,
              //             value: item.id,
              //           }))}
              //           placeholder="여기에서 부서를 선택하세요" // Select departments here
              //           hidePlaceholderWhenSelected={true}
              //           onChange={(e) =>
              //             form.setValue(
              //               "departments",
              //               e.map((item) => item.value),
              //               { shouldValidate: true }
              //             )
              //           }
              //           emptyIndicator={
              //             // no results found.
              //             <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
              //               결과가 없습니다.
              //             </p>
              //           }
              //         />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
