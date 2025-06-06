import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import AddressSelector from "../address-selector";

type FormAddressProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  formItemClassName?: string;
  formLabelClassName?: string;
};

export default function FormAddress<T extends FieldValues>({
  control,
  name,
  label,
  formItemClassName,
  formLabelClassName,
}: FormAddressProps<T>) {
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
            <AddressSelector
              onAddressSelect={(city, region) =>
                field.onChange(`${city},${region}`)
              }
              initialCity={field.value?.split(",")[0] || ""}
              initialRegion={field.value?.split(",")[1] || ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
