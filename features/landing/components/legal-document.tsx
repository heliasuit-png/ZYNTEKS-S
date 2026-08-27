import type { Metadata } from "next";

import { LegalPage } from "@/features/landing/components/legal-page";
import {
  getLegalDocument,
  type LegalDocumentKind,
} from "@/features/landing/data/legal-content";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type LegalKind = LegalDocumentKind;

export async function LegalDocument({ kind }: { kind: LegalKind }) {
  const { dict } = await getDictionary();
  const title = titleFor(kind, dict.legal);
  const doc = getLegalDocument(kind);

  return (
    <LegalPage title={title} lastUpdated={doc.lastUpdated}>
      {doc.intro.map((paragraph, index) => (
        <p key={`intro-${index}`}>{paragraph}</p>
      ))}
      {doc.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="pt-4 text-lg font-semibold text-zt-text">
            {section.heading}
          </h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={`p-${index}`}>{paragraph}</p>
          ))}
          {section.bullets && section.bullets.length > 0 ? (
            <ul className="list-disc space-y-1.5 pl-5">
              {section.bullets.map((item, index) => (
                <li key={`b-${index}`}>{item}</li>
              ))}
            </ul>
          ) : null}
          {section.paragraphsAfterBullets?.map((paragraph, index) => (
            <p key={`pa-${index}`}>{paragraph}</p>
          ))}
        </section>
      ))}
      {doc.closing?.map((paragraph, index) => (
        <p key={`close-${index}`}>{paragraph}</p>
      ))}
    </LegalPage>
  );
}

export async function legalMetadata(kind: LegalKind): Promise<Metadata> {
  const { dict } = await getDictionary();
  const title = titleFor(kind, dict.legal);
  return {
    title,
    description: title,
  };
}

function titleFor(kind: LegalKind, legal: Dictionary["legal"]) {
  switch (kind) {
    case "privacy":
      return legal.privacyTitle;
    case "terms":
      return legal.termsTitle;
    case "cookie":
      return legal.cookieTitle;
    case "kvkk":
      return legal.kvkkTitle;
    case "distance-sales":
      return legal.distanceSalesTitle;
    case "preliminary-information":
      return legal.preliminaryInformationTitle;
    case "refund-cancellation":
      return legal.refundCancellationTitle;
  }
}
