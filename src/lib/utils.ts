import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
