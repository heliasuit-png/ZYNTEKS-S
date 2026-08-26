import type { Metadata, Viewport } from "next";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { env } from "@/lib/env";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { APPEARANCE_BOOTSTRAP_SCRIPT } from "@/features/settings/lib/appearance";
import "@/styles/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: dict.meta.description || APP_DESCRIPTION,
    applicationName: APP_NAME,
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale } = await getDictionary();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body className="min-h-screen bg-zt-bg font-sans text-zt-text antialiased">
        {children}
      </body>
    </html>
  );
}
