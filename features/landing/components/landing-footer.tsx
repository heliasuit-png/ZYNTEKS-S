import Link from "next/link";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { PaymentMethodsRow } from "@/features/landing/components/payment-methods-row";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function LandingFooter() {
  const { locale, dict } = await getDictionary();
  const year = new Date().getFullYear();

  const PRODUCT = [
    { href: "#features", label: dict.nav.features },
    { href: "#sdk", label: dict.nav.sdk },
    { href: "#pricing", label: dict.nav.pricing },
    { href: ROUTES.pricing, label: dict.nav.pricing },
  ] as const;

  const COMPANY = [
    { href: ROUTES.docs, label: dict.footer.documentation },
    { href: ROUTES.contact, label: dict.footer.contact },
  ] as const;

  const LEGAL = [
    { href: ROUTES.legalPrivacy, label: dict.footer.privacy },
    { href: ROUTES.legalTerms, label: dict.footer.terms },
    { href: ROUTES.legalCookie, label: dict.footer.cookie },
    { href: ROUTES.legalKvkk, label: dict.footer.kvkk },
  ] as const;

  return (
    <footer className="border-t border-zt-border px-5 pt-14 pb-10 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-[family-name:var(--font-landing-display)] text-lg font-semibold text-zt-text">
            {APP_NAME}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-zt-muted">
            {dict.meta.description}
          </p>
          <div className="mt-4">
            <LanguageSwitcher
              locale={locale}
              labels={{
                english: dict.common.english,
                turkish: dict.common.turkish,
                language: dict.common.language,
              }}
            />
          </div>
        </div>

        <FooterColumn title={dict.footer.product} links={PRODUCT} />
        <FooterColumn title={dict.footer.company} links={COMPANY} />
        <FooterColumn title={dict.footer.legal} links={LEGAL} />
      </div>

      <PaymentMethodsRow
        title={dict.footer.paymentMethods}
        labels={{
          visa: dict.footer.paymentVisa,
          mastercard: dict.footer.paymentMastercard,
          amex: dict.footer.paymentAmex,
          discover: dict.footer.paymentDiscover,
          diners: dict.footer.paymentDiners,
        }}
      />

      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-2 border-t border-zt-border pt-6 text-xs text-zt-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © <span suppressHydrationWarning>{year}</span> {APP_NAME}.{" "}
          {dict.footer.rights}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href={ROUTES.login} className="hover:text-zt-text">
            {dict.common.signIn}
          </Link>
          <span aria-hidden>·</span>
          <Link href={ROUTES.register} className="hover:text-zt-text">
            {dict.common.startFree}
          </Link>
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-zt-text">{title}</p>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.href + link.label}>
            {link.href.startsWith("#") ? (
              <a
                href={link.href}
                className="text-sm text-zt-muted transition-colors hover:text-zt-text"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-zt-muted transition-colors hover:text-zt-text"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
