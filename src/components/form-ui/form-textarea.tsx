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
          <FormControl>
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
