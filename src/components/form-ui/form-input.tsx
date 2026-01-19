/**
 * FormInput - A reusable input form field component for React Hook Form.
 *
 * @example
 * // In your form component:
 * import { useForm } from "react-hook-form";
 * import { Form } from "../ui/form";
 * import FormInput from "@/components/form-ui/form-input";
 *
 * const form = useForm();
 *
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <FormInput
 *         control={form.control}
 *         name="name"
 *         label="이름" // Name
 *         placeholder="이름을 입력해주세요" // Please enter your name
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
 * @param label - The label for the input (string)
 * @param placeholder - Placeholder text
 * @param formItemClassName - Custom class for the FormItem
 * @param formLabelClassName - Custom class for the FormLabel
 * @param formControlClassName - Custom class for the FormControl
 * @param inputClassName - Custom class for the input
 */

import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { HTMLInputTypeAttribute, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  step?: string | number;
  formItemClassName?: string;
  formLabelClassName?: string;
  inputClassName?: string;
};

export default function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  step,
  disabled = false,
  formItemClassName,
  formLabelClassName,
  inputClassName,
}: FormInputProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === "password";

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
              <Input
                type={
                  isPasswordType ? (showPassword ? "text" : "password") : type
                }
                step={step}
                className={cn("h-[45px] pr-10", inputClassName)}
                placeholder={placeholder}
                disabled={disabled}
                {...field}
              />
              {isPasswordType && (
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
