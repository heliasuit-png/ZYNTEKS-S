import type { Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";
import { tr } from "@/lib/i18n/dictionaries/tr";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

export type {
  AdminDictionary,
  Dictionary,
} from "@/lib/i18n/dictionaries/types";
export { en } from "@/lib/i18n/dictionaries/en";
export { tr } from "@/lib/i18n/dictionaries/tr";

export const dictionaries: Record<Locale, Dictionary> = { en, tr };
