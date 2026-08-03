import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names conditionally and resolves Tailwind class conflicts.
 * Used by shadcn/ui components and shared throughout the UI layer.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
