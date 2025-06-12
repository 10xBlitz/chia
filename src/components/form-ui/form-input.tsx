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
