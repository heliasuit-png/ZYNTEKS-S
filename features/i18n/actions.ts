"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  type Locale,
} from "@/lib/i18n/config";

export async function setLocaleAction(locale: string): Promise<{ ok: boolean }> {
  if (!isLocale(locale)) {
    return { ok: false };
  }
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale as Locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
