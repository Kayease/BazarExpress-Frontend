import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to round prices to avoid decimal payments
export function roundPrice(amount: number): number {
  return Math.round(amount);
}

// Format price for display with rupee symbol
export function formatPrice(amount: number): string {
  return `₹${roundPrice(amount)}`;
}
