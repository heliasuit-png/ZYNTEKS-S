import { API_KEY_MASK_LENGTH } from "@/lib/constants";

/**
 * Client-safe API key display helpers. Contains no cryptography, so it is safe
 * to import in both server and client components.
 */

/** Builds the masked display value from a stored display prefix. */
export function buildMaskedKey(prefix: string): string {
  return `${prefix}${"*".repeat(API_KEY_MASK_LENGTH)}`;
}
