import type { Metadata } from "next";
import Link from "next/link";

import { APP_NAME, DASHBOARD_ROUTES, ROUTES } from "@/lib/constants";
import { LegalPage } from "@/features/landing/components/legal-page";

export const metadata: Metadata = {
  title: "Documentation",
  description: `${APP_NAME} quick start: account, project, API key, browser SDK, and server ingest.`,
  alternates: { canonical: "/docs" },
  openGraph: {
    title: `Documentation | ${APP_NAME}`,
    description: `${APP_NAME} quick start for monitoring, SDK ingest, and AI.`,
    url: "/docs",
  },
};

export default function DocsPage() {
  return (
    <LegalPage title="Documentation">
      <p>
        Go from a fresh workspace to live telemetry. Full engineer reference:
        repository files <code className="text-zt-text">docs/SDK.md</code> and{" "}
        <code className="text-zt-text">sdk/README.md</code>.
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
        . A default workspace is created for you. Start with the AI assistant —
        you do not need a project for chat.
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
        and create a project for each service you monitor. Each API key belongs
        to exactly one project (project isolation).
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
        the prefix is stored for display afterward. Keys are{" "}
        <code className="text-zt-text">ZYN-KEY-…</code> project ingest keys, not
        Supabase <code className="text-zt-text">service_role</code> secrets.
      </p>

      <h2 className="pt-4 text-lg font-semibold text-zt-text">4. Install the SDK</h2>
      <p>
        Build the local package, then path-install it (not published to public
        npm with the commercial delivery):
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg border border-zt-border bg-black/30 p-3 font-mono text-xs text-zt-text">
{`cd sdk && npm install && npm run build
npm install /absolute/path/to/zynteksis/sdk`}
      </pre>
      <p className="mt-2">
        Browser init:{" "}
        <code className="text-zt-text">
          new Zynteksis(&#123; apiKey, endpoint &#125;).init()
        </code>
        . See the connection guide on the API Keys page and the landing{" "}
        <Link className="text-zt-primary hover:underline" href="/#sdk">
          SDK section
        </Link>
        .
      </p>

      <h2 className="pt-4 text-lg font-semibold text-zt-text">5. Server / HTTP ingest</h2>
      <p>
        <code className="text-zt-text">init()</code> is browser-only. From
        servers, POST to{" "}
        <code className="text-zt-text">/api/sdk/heartbeat</code>,{" "}
        <code className="text-zt-text">/api/sdk/error</code>,{" "}
        <code className="text-zt-text">/api/sdk/performance</code>, and{" "}
        <code className="text-zt-text">/api/sdk/events</code> with header{" "}
        <code className="text-zt-text">X-Zynteksis-Key</code> (or Bearer).
      </p>

      <h2 className="pt-4 text-lg font-semibold text-zt-text">6. Operate</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Errors, Health, and Incidents for monitoring</li>
        <li>AI Assistant for telemetry-backed analysis (plan message quotas)</li>
        <li>Status Pages for public communication</li>
        <li>
          <Link
            className="text-zt-primary hover:underline"
            href={DASHBOARD_ROUTES.billing}
          >
            Billing
          </Link>{" "}
          for plan limits (checkout provider is pluggable and not bundled)
        </li>
      </ul>

      <h2 className="pt-4 text-lg font-semibold text-zt-text">Troubleshooting</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-zt-text">401 on ingest</strong> — key missing,
          wrong, or revoked; regenerate on API Keys.
        </li>
        <li>
          <strong className="text-zt-text">No data in dashboard</strong> — confirm
          the key&apos;s project and that <code className="text-zt-text">endpoint</code>{" "}
          points at your ZYNTEKSIS origin.
        </li>
        <li>
          <strong className="text-zt-text">Rate limits</strong> — ingest is limited
          (default 240 requests / minute / key). Back off and retry.
        </li>
      </ul>
    </LegalPage>
  );
}
