import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ko } from "date-fns/locale";

interface KoreanDatePickerProps {
  field: {
    value: Date | null;
    onChange: (newValue: Date | null) => void;
  };
  disabled?: boolean;
}

export default function KoreanDatePicker({
  field,
  disabled = false,
}: KoreanDatePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <DatePicker
        value={field.value}
        disabled={disabled}
        onChange={(newValue) => {
          field.onChange(newValue);
        }}
        slotProps={{
          textField: {
            InputProps: {
              disableUnderline: true, // remove underline for clean look
            },
            variant: "standard", // start from minimal style
            sx: {
              border: "1px solid #e5e7eb", // Tailwind: border-gray-300
              borderRadius: "0.5rem", // Tailwind: rounded-md
              paddingLeft: "0.75rem", // Tailwind: px-3
              paddingRight: "0.75rem",
              paddingTop: "0.40rem", // Tailwind: pt-1
              height: "45px", // Tailwind: h-10
              fontSize: "0.875rem", // Tailwind: text-sm
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}
