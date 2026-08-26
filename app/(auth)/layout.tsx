import { AuroraBackground } from "@/components/dashboard/shell/aurora-background";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, dict } = await getDictionary();

  return (
    <main
      data-auth-theme
      className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070c] px-4 py-10 text-[#f4f7fb] sm:px-6 sm:py-14"
    >
      <AuroraBackground />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.14),transparent_55%)]"
      />
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <LanguageSwitcher
          locale={locale}
          labels={{
            english: dict.common.english,
            turkish: dict.common.turkish,
            language: dict.common.language,
          }}
        />
      </div>
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}
