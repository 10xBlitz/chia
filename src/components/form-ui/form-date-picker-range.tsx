import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import { KoreanDateRangePicker } from "../korean-date-picker-range";

type FormDateRangePickerProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  formItemClassName?: string;
  formLabelClassName?: string;
};

export default function FormDateRangePicker<T extends FieldValues>({
  control,
  name,
  label,
  formItemClassName,
  formLabelClassName,
}: FormDateRangePickerProps<T>) {
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
            <KoreanDateRangePicker
              onChange={field.onChange}
              value={field.value}
              disabled={false}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
