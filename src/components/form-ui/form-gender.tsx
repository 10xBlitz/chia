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
