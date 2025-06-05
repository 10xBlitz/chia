import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import { PhoneInput } from "../phone-input";
import { Country } from "react-phone-number-input";

type FormContactNumberProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  type?: string;
  defaultCountry: Country;
  formItemClassName?: string;
  formLabelClassName?: string;
};

export default function FormContactNumber<T extends FieldValues>({
  control,
  name,
  label,
  defaultCountry = "KR",
  formItemClassName,
  formLabelClassName,
}: FormContactNumberProps<T>) {
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
            <PhoneInput
              defaultCountry={defaultCountry}
              onChange={field.onChange}
              value={field.value}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
