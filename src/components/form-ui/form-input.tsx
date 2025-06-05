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
import { HTMLInputTypeAttribute } from "react";

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
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
            <Input
              type={type}
              className={cn("h-[45px]", inputClassName)}
              placeholder={placeholder}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
