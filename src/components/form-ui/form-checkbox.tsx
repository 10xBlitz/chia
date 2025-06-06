import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
  formItemClassName?: string;
  formLabelClassName?: string;
  checkboxClassName?: string;
};

export default function FormCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  disabled = false,
  formItemClassName,
  formLabelClassName,
  checkboxClassName,
}: FormInputProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={formItemClassName}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              className={checkboxClassName}
            />
          </FormControl>
          <FormLabel
            className={cn(
              "text-[16px] font-pretendard-600",
              formLabelClassName
            )}
          >
            {label}
          </FormLabel>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
