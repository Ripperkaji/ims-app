import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00';
  }
  // Add a small epsilon for floating point inaccuracies, then round to 2 decimal places.
  return (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2);
}
