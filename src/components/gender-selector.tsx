import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface GenderSelectorProps {
  onValueChange: (value: string) => void;
  value: string; // Controlled component: current selected value
  disabled?: boolean;
  className?: string;
}
export default function GenderSelector({
  onValueChange,
  value,
  disabled,
  className,
}: GenderSelectorProps) {
  return (
    <div className="w-full ">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(newValue) => {
          if (newValue) {
            onValueChange(newValue);
          }
        }}
        disabled={disabled}
        className="flex gap-3 w-full "
      >
        <ToggleGroupItem
          value="남성"
          aria-label="Toggle male"
          className={cn(
            "rounded-lg border-1 h-[45px] !text-[16px] !font-pretendard-500", // Base styles for both states
            value === "남성"
              ? "border-[#287DFA] !text-[#287DFA]" // Selected state for Male
              : "hover:border-gray-300 opacity-50", // Unselected state for Male
            className
          )}
        >
          남성 {/* male*/}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="여성"
          aria-label="Toggle female"
          className={cn(
            "rounded-lg border-1 h-[45px] !text-[16px] !font-pretendard-500", // Base styles for both states
            value === "여성"
              ? "border-[#287DFA] !text-[#287DFA]" // Selected state for Female
              : "hover:border-gray-300 opacity-50", // Unselected state for Female
            className
          )}
        >
          여성 {/* female*/}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
