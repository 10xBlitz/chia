"use client";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import MultipleSelector, { Option } from "../ui/multiple-selector";

type FormMultiSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  formLabelClassName?: string;
  options: Option[] | undefined;
  loading?: boolean;
  emptyIndicator?: React.ReactNode;
  onChange: (values: Option[]) => void;
  value?: Option[];
};

export default function FormMultiSelect<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  formLabelClassName,
  options,
  loading,
  onChange,
}: FormMultiSelectProps<T>) {
  console.log("----->options:", options);
  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel
            className={cn(
              "text-[16px] font-pretendard-600",
              formLabelClassName
            )}
          >
            {label}
          </FormLabel>
          <FormControl>
            {loading ? (
              <span className="text-gray-400 text-sm">
                로딩 중입니다... {/**Loading... */}
              </span>
            ) : (
              <MultipleSelector
                selectFirstItem={false}
                defaultOptions={options}
                placeholder={placeholder}
                hidePlaceholderWhenSelected={true}
                onChange={(selected) => {
                  onChange(selected);
                }}
                emptyIndicator={
                  // no results found.
                  <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                    결과가 없습니다.
                  </p>
                }
              />

              //    <MultipleSelector
              //           selectFirstItem={false}
              //           defaultOptions={departments?.map((item) => ({
              //             label: item.department_name,
              //             value: item.id,
              //           }))}
              //           placeholder="여기에서 부서를 선택하세요" // Select departments here
              //           hidePlaceholderWhenSelected={true}
              //           onChange={(e) =>
              //             form.setValue(
              //               "departments",
              //               e.map((item) => item.value),
              //               { shouldValidate: true }
              //             )
              //           }
              //           emptyIndicator={
              //             // no results found.
              //             <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
              //               결과가 없습니다.
              //             </p>
              //           }
              //         />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
