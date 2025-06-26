import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Enums } from "./supabase/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Parses a date range string like "[2025-06-01,2025-07-02)" and returns { from, to } as Date objects.
 */
export function parseDateFromSupabase(
  range: string
): { from: Date; to: Date } | null {
  if (!range) return null;
  // Remove brackets/parentheses and split
  const [fromStr, toStr] = range.replace(/[\[\]\(\)]/g, "").split(",");
  if (!fromStr || !toStr) return null;
  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;
  return { from, to };
}

/**
 * Calculates the final price of an item after applying a percentage discount.
 *
 * @param {number} originalPrice The original price of the item. Must be a non-negative number.
 * @param {number} discountPercentage The discount percentage (e.g., 20 for 20%). Must be between 0 and 100.
 * @returns {number | string} The final price after discount, or an error message string if inputs are invalid.
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercentage: number
): number | string {
  // Input validation: Check if originalPrice is a valid non-negative number
  if (typeof originalPrice !== "number" || originalPrice < 0) {
    console.error(
      "Invalid input: Original price must be a non-negative number."
    );
    return "Error: Invalid original price.";
  }

  // Input validation: Check if discountPercentage is a valid number between 0 and 100
  if (
    typeof discountPercentage !== "number" ||
    discountPercentage < 0 ||
    discountPercentage > 100
  ) {
    console.error(
      "Invalid input: Discount percentage must be a number between 0 and 100."
    );
    return "Error: Invalid discount percentage.";
  }

  // Convert the discount percentage to a decimal
  // For example, 20% becomes 0.20
  const discountDecimal: number = discountPercentage / 100;

  // Calculate the discount amount
  // This is how much money is taken off the original price
  const discountAmount: number = originalPrice * discountDecimal;

  // Calculate the final price by subtracting the discount amount from the original price
  const finalPrice: number = originalPrice - discountAmount;

  // You can also calculate it directly:
  // const finalPrice = originalPrice * (1 - discountDecimal);

  // Return the calculated final price.
  // Using toFixed(2) to ensure the price is formatted to two decimal places,
  // which is common for currency. Convert it back to a number using parseFloat.
  return parseFloat(finalPrice.toFixed(2));
}

/** * Returns the day of the week in Korean for a given date.
 * @param date - A string or Date object representing the date.
 * @returns The day of the week in Korean (e.g., "월요일" for Monday).
 * @example
 * getKoreanDayOfWeek("2023-10-01"); // Returns "일요일"
 * getKoreanDayOfWeek(new Date("2023-10-02")); // Returns "월요일"
 */
export const getKoreanDayOfWeek = (
  date: string | Date
): Enums<"day_of_week"> => {
  const days = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ] as const;
  const d = typeof date === "string" ? new Date(date) : date;
  return days[d.getDay()];
};

/**
 * Extracts the region (시/도 + 구/군) from a full Korean address string.
 * E.g. "부산 부산진구 가야대로 지하 719 (부전동, 지하철 부암역)" => "부산 부산진구"
 * Returns the first two space-separated parts.
 */
export function extractRegionFromAddress(address: string): string {
  if (!address) return "";
  const parts = address.split(" ");
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : address;
}
