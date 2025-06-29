import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  // Perform reliable rounding to handle floating point inaccuracies
  const roundedValue = Math.round((value + Number.EPSILON) * 100) / 100;
  
  // Format to string, showing decimals only when necessary
  if (roundedValue % 1 === 0) {
    return roundedValue.toString();
  }
  return roundedValue.toFixed(2);
}
