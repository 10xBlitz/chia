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
};

export default function FormDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  formItemClassName,
  formLabelClassName,
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
              disabled={field.disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
