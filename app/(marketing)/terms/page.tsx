import type { Metadata } from "next";

import { APP_NAME } from "@/lib/constants";
import { LegalPage } from "@/features/landing/components/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: `Terms of use for ${APP_NAME}.`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        By accessing or operating {APP_NAME}, you agree to use the software
        lawfully, keep credentials confidential, and respect the rights of your
        end users whose telemetry you collect.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">License &amp; source</h2>
      <p>
        {APP_NAME} is distributed as application source. Your commercial
        license or purchase agreement governs redistribution and branding. Plan
        limits shipped in the product are enforced locally until you connect a
        payment provider.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">Acceptable use</h2>
      <p>
        You may not use the platform to probe or attack systems without
        authorization, to store secrets in client-visible configuration, or to
        misrepresent operational status to customers.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">No warranty</h2>
      <p>
        The software is provided as-is. Operators are responsible for backups,
        uptime, and compliance for their deployment. Payment processing is not
        bundled; any provider you integrate is subject to that provider&apos;s
        terms.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">Contact</h2>
      <p>
        Legal questions:{" "}
        <a className="text-zt-primary hover:underline" href="mailto:legal@zynteksis.com">
          legal@zynteksis.com
        </a>
      </p>
    </LegalPage>
  );
}
