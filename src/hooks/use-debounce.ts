// hooks/useDebounce.ts
import { useEffect, useState } from "react";

/**
 * Debounce a value by a given delay
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value or delay changes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
