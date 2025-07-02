import { Control, FieldPath, FieldValues } from "react-hook-form";
import { Star } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import React from "react";

/**
 * FormStarRating - A reusable star rating field for React Hook Form.
 *
 * @example
 * <FormStarRating control={form.control} name="rating" label="평점" max={5} />
 * <FormStarRating control={form.control} name="rating" label="Rating" max={10} icon={{ filled: <Star ... />, empty: <Star ... /> }} />
 *
 * @param control - The react-hook-form control object
 * @param name - The field name (string)
 * @param label - The label for the rating (string)
 * @param max - The maximum rating value (number, default 5)
 * @param icon - Optional: { filled: ReactNode, empty: ReactNode } for custom icons
 */
export default function FormStarRating<T extends FieldValues>({
  control,
  name,
  label,
  max = 5,
  icon,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  max?: number;
  icon?: { filled: React.ReactNode; empty: React.ReactNode };
}) {
  // 별점 선택 컴포넌트 (Star rating component)
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        let value = 0;
        if (typeof field.value === "string") {
          value = Number(field.value);
        } else if (typeof field.value === "number") {
          value = field.value;
        }
        // Ignore string[] possibility for rating
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`별점 ${star}점`} // Star {star}
                    onClick={() => field.onChange(star)}
                    className={
                      star <= value ? "text-yellow-400" : "text-gray-300"
                    }
                  >
                    {icon ? (
                      star <= value ? (
                        icon.filled
                      ) : (
                        icon.empty
                      )
                    ) : (
                      <Star
                        size={28}
                        fill={star <= value ? "#facc15" : "none"}
                      />
                    )}
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
