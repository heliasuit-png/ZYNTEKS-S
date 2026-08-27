import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/lib/constants";
import { LegalPage } from "@/features/landing/components/legal-page";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return {
    title: dict.contact.title,
    description: dict.contact.intro,
  };
}

export default async function ContactPage() {
  const { dict } = await getDictionary();
  const c = dict.contact;

  return (
    <LegalPage title={c.title}>
      <p>{c.intro}</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          {c.general}{" "}
          <a
            className="text-zt-primary hover:underline"
            href="mailto:hello@zynteksis.com"
          >
            hello@zynteksis.com
          </a>
        </li>
        <li>
          {c.billing}{" "}
          <a
            className="text-zt-primary hover:underline"
            href="mailto:billing@zynteksis.com"
          >
            billing@zynteksis.com
          </a>
        </li>
        <li>
          {c.productAccess}{" "}
          <Link className="text-zt-primary hover:underline" href={ROUTES.register}>
            {c.createAccount}
          </Link>
        </li>
      </ul>
    </LegalPage>
  );
}
