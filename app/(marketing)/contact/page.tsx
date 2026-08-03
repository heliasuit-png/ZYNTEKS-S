import type { Metadata } from "next";

import { APP_NAME, ROUTES } from "@/lib/constants";
import { LegalPage } from "@/features/landing/components/legal-page";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${APP_NAME}.`,
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact">
      <p>
        Questions about the platform, licensing, or deployment? Reach the team
        below.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          General:{" "}
          <a
            className="text-zt-primary hover:underline"
            href="mailto:hello@zynteksis.com"
          >
            hello@zynteksis.com
          </a>
        </li>
        <li>
          Billing architecture:{" "}
          <a
            className="text-zt-primary hover:underline"
            href="mailto:billing@zynteksis.com"
          >
            billing@zynteksis.com
          </a>
        </li>
        <li>
          Product access:{" "}
          <Link className="text-zt-primary hover:underline" href={ROUTES.register}>
            Create an account
          </Link>
        </li>
      </ul>
    </LegalPage>
  );
}
