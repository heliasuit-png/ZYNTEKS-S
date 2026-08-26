import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  resolveLocale,
  type Locale,
} from "@/lib/i18n/config";
import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  return resolveLocale(jar.get(LOCALE_COOKIE)?.value);
}

export async function getDictionary(): Promise<{
  locale: Locale;
  dict: Dictionary;
}> {
  const locale = await getLocale();
  return { locale, dict: dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE] };
}
