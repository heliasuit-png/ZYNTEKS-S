export const LOCALES = ["en", "tr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "zynteksis_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "tr";
}

export function resolveLocale(value: string | undefined | null): Locale {
  if (isLocale(value)) return value;
  return DEFAULT_LOCALE;
}
