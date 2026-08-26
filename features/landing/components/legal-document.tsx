import type { Metadata } from "next";

import { LegalPage } from "@/features/landing/components/legal-page";
import {
  cookieSections,
  kvkkSections,
  legalDraftNotice,
  privacySections,
  termsSections,
} from "@/features/landing/data/legal-content";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type Kind = "privacy" | "terms" | "cookie" | "kvkk";

export async function LegalDocument({ kind }: { kind: Kind }) {
  const { locale, dict } = await getDictionary();
  const title = titleFor(kind, dict.legal);
  const sections = sectionsFor(kind, locale);

  return (
    <LegalPage title={title}>
      <p className="rounded-lg border border-zt-border/80 bg-zt-surface/40 px-3 py-2 text-xs text-zt-muted">
        {legalDraftNotice(locale)}
      </p>
      {sections.map((s) => (
        <div key={s.h}>
          <h2 className="pt-4 text-lg font-semibold text-zt-text">{s.h}</h2>
          <p>{s.p}</p>
        </div>
      ))}
    </LegalPage>
  );
}

export async function legalMetadata(kind: Kind): Promise<Metadata> {
  const { dict } = await getDictionary();
  return {
    title: titleFor(kind, dict.legal),
    description: dict.legal.draftNotice,
  };
}

function titleFor(
  kind: Kind,
  legal: {
    privacyTitle: string;
    termsTitle: string;
    cookieTitle: string;
    kvkkTitle: string;
  },
) {
  switch (kind) {
    case "privacy":
      return legal.privacyTitle;
    case "terms":
      return legal.termsTitle;
    case "cookie":
      return legal.cookieTitle;
    case "kvkk":
      return legal.kvkkTitle;
  }
}

function sectionsFor(kind: Kind, locale: Locale) {
  switch (kind) {
    case "privacy":
      return privacySections(locale);
    case "terms":
      return termsSections(locale);
    case "cookie":
      return cookieSections(locale);
    case "kvkk":
      return kvkkSections(locale);
  }
}
