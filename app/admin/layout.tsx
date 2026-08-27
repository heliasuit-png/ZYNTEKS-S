import type { ReactNode } from "react";

import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getDictionary } from "@/lib/i18n/get-dictionary";

import "@/features/admin/admin-theme.css";

export default async function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { locale, dict } = await getDictionary();

  return (
    <LocaleProvider locale={locale} dict={dict}>
      <div data-admin-theme>{children}</div>
    </LocaleProvider>
  );
}
