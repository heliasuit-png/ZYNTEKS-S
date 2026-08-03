import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME, DASHBOARD_ROUTES, ROUTES } from "@/lib/constants";
import { LegalPage } from "@/features/landing/components/legal-page";

export const metadata: Metadata = {
  title: "Documentation",
  description: `${APP_NAME} documentation overview.`,
};

export default function DocsPage() {
  return (
    <LegalPage title="Documentation">
      <p>
        Use this guide to go from a fresh workspace to live telemetry and
        operational workflows.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">1. Create an account</h2>
      <p>
        <Link className="text-zt-primary hover:underline" href={ROUTES.register}>
          Register
        </Link>{" "}
        or{" "}
        <Link className="text-zt-primary hover:underline" href={ROUTES.login}>
          sign in
        </Link>
        . A default workspace is created for you.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">2. Create a project</h2>
      <p>
        Open{" "}
        <Link
          className="text-zt-primary hover:underline"
          href={DASHBOARD_ROUTES.projects}
        >
          Projects
        </Link>{" "}
        and create a project for each service you monitor.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">3. Generate an API key</h2>
      <p>
        In{" "}
        <Link
          className="text-zt-primary hover:underline"
          href={DASHBOARD_ROUTES.apiKeys}
        >
          API Keys
        </Link>
        , create a key for production or staging. Copy the secret once — only
        the prefix is stored for display afterward.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">4. Install the browser SDK</h2>
      <p>
        Follow the install snippets on the{" "}
        <Link className="text-zt-primary hover:underline" href="/#sdk">
          landing SDK section
        </Link>{" "}
        or in the API Keys installer. The SDK initializes in browser environments
        with <code className="text-zt-text">new Zynteksis(&#123; apiKey &#125;).init()</code>.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">5. Operate</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Errors, Health, and Incidents for monitoring</li>
        <li>AI Assistant for telemetry-backed analysis</li>
        <li>Status Pages for public communication</li>
        <li>
          <Link
            className="text-zt-primary hover:underline"
            href={DASHBOARD_ROUTES.billing}
          >
            Billing
          </Link>{" "}
          for plan limits and the pluggable payment provider surface
        </li>
      </ul>
    </LegalPage>
  );
}
