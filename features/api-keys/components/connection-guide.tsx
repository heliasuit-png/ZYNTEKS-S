"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, LayoutDashboard } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { CopyButton } from "@/components/dashboard/copy-button";
import {
  API_ROUTES,
  DASHBOARD_ROUTES,
  ROUTES,
  ZYNTEKSIS_PRODUCTION_ENDPOINT,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export { ZYNTEKSIS_PRODUCTION_ENDPOINT };
const INSTALL_PATH = `npm install /absolute/path/to/zynteksis/sdk`;
const INSTALL_NPM_NOTE =
  "# Prefer path-install from the commercial delivery (build sdk/ first).\n# Public npm publish is buyer-owned — do not expect registry.npmjs.org.\nnpm install @zynteksis/sdk";

function browserInitExample(): string {
  return `import { Zynteksis } from "@zynteksis/sdk";

const zyn = new Zynteksis({
  apiKey: "ZYN-KEY-XXXXXXXXXXXXXXXXXXXXXXXX",
  environment: "production",
  release: "1.0.0",
  // Required when your app is not hosted on the same origin as ZYNTEKSIS.
  endpoint: "${ZYNTEKSIS_PRODUCTION_ENDPOINT}",
});

zyn.init();

// Optional manual reports
zyn.captureException(new Error("Something broke"));
zyn.captureMessage("Checkout completed", "info");
zyn.captureEvent({ type: "user.action", name: "upgrade_clicked" });`;
}

function heartbeatExample(): string {
  return `// Automatic after init() when captureHeartbeat is enabled (default).
// Manual-equivalent HTTP (server / scripts) — header must be the project API key:

curl -X POST "${ZYNTEKSIS_PRODUCTION_ENDPOINT}${API_ROUTES.sdkHeartbeat}" \\
  -H "Content-Type: application/json" \\
  -H "X-Zynteksis-Key: ZYN-KEY-XXXXXXXXXXXXXXXXXXXXXXXX" \\
  -d '{"environment":"production","release":"1.0.0"}'`;
}

function errorExample(): string {
  return `// Browser SDK (after init):
zyn.captureException(new Error("Payment form failed"));

// Equivalent HTTP ingest:
curl -X POST "${ZYNTEKSIS_PRODUCTION_ENDPOINT}${API_ROUTES.sdkError}" \\
  -H "Content-Type: application/json" \\
  -H "X-Zynteksis-Key: ZYN-KEY-XXXXXXXXXXXXXXXXXXXXXXXX" \\
  -d '{"message":"Payment form failed","environment":"production"}'`;
}

function serverHttpExample(): string {
  return `// Node / server — @zynteksis/sdk init() is browser-only.
// Use the same ingest contract with your project API key (never service_role):

const endpoint = "${ZYNTEKSIS_PRODUCTION_ENDPOINT}";
const apiKey = process.env.ZYNTEKSIS_API_KEY; // ZYN-KEY-… from API Keys page

await fetch(\`\${endpoint}${API_ROUTES.sdkHeartbeat}\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Zynteksis-Key": apiKey,
  },
  body: JSON.stringify({ environment: "production", release: "1.0.0" }),
});

// Also available:
// POST ${API_ROUTES.sdkError}
// POST ${API_ROUTES.sdkPerformance}
// POST ${API_ROUTES.sdkEvents}
// Auth alternative: Authorization: Bearer <ZYN-KEY-…>`;
}

type TabId = "install" | "browser" | "server" | "heartbeat" | "error" | "monitor";

function CodeBlock({
  title,
  code,
}: {
  title: string;
  code: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zt-border bg-black/40">
      <div className="flex items-center justify-between border-b border-zt-border px-3 py-1.5">
        <span className="font-mono text-[11px] text-zt-muted">{title}</span>
        <CopyButton value={code} className="border-0 bg-transparent px-1.5 py-0.5" />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed text-zt-text/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Guides connecting an external app via @zynteksis/sdk / ingest HTTP.
 * No secrets; placeholders only.
 */
export function ApiKeyConnectionGuide({
  className,
  hasProjects = true,
}: {
  className?: string;
  hasProjects?: boolean;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.apiKeys.connectionGuide;
  const [tab, setTab] = useState<TabId>("install");

  const tabs = useMemo(
    () =>
      [
        { id: "install" as const, label: t.tabInstall },
        { id: "browser" as const, label: t.tabBrowser },
        { id: "server" as const, label: t.tabServer },
        { id: "heartbeat" as const, label: t.tabHeartbeat },
        { id: "error" as const, label: t.tabErrors },
        { id: "monitor" as const, label: t.tabDashboard },
      ] satisfies { id: TabId; label: string }[],
    [t],
  );

  return (
    <section
      className={cn(
        "space-y-4 rounded-2xl border border-zt-border bg-white/[0.02] p-4 sm:p-5",
        className,
      )}
      aria-labelledby="connection-guide-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="connection-guide-heading"
            className="text-base font-semibold text-zt-text"
          >
            {t.title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zt-muted">
            {hasProjects ? t.descWithProjects : t.descNoProjects}
          </p>
          {!hasProjects ? (
            <p className="mt-2 text-sm text-zt-text">
              <Link
                href={DASHBOARD_ROUTES.projects}
                className="font-medium text-zt-primary hover:underline"
              >
                {t.goToProjects}
              </Link>{" "}
              {t.createThenReturn}
            </p>
          ) : null}
        </div>
        <Link
          href={ROUTES.docs}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zt-primary hover:underline"
        >
          <BookOpen className="size-3.5" aria-hidden />
          {t.fullDocs}
        </Link>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-zt-warning/30 bg-zt-warning/10 px-3 py-2 text-xs text-zt-warning">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>{t.warning}</p>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t.stepsAria}>
        {tabs.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "border-zt-primary/40 bg-gradient-to-r from-zt-primary/20 to-zt-secondary/10 text-zt-text"
                  : "border-zt-border bg-white/[0.02] text-zt-muted hover:border-zt-border-strong hover:text-zt-text",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "install" ? (
        <div className="space-y-3">
          <CodeBlock title="terminal" code={INSTALL_PATH} />
          <CodeBlock title="optional-private-registry" code={INSTALL_NPM_NOTE} />
          <p className="text-xs text-zt-muted">{t.buildFirst}</p>
        </div>
      ) : null}

      {tab === "browser" ? (
        <div className="space-y-3">
          <CodeBlock title={t.codeBrowserEntry} code={browserInitExample()} />
          <p className="text-xs text-zt-muted">{t.browserHeader}</p>
          <p className="text-xs text-zt-muted">{t.browserNative}</p>
        </div>
      ) : null}

      {tab === "server" ? (
        <div className="space-y-3">
          <CodeBlock title="server.mjs" code={serverHttpExample()} />
          <p className="text-xs text-zt-muted">{t.serverOnly}</p>
        </div>
      ) : null}

      {tab === "heartbeat" ? (
        <CodeBlock title="heartbeat" code={heartbeatExample()} />
      ) : null}

      {tab === "error" ? (
        <CodeBlock title={t.codeErrorReporting} code={errorExample()} />
      ) : null}

      {tab === "monitor" ? (
        <div className="space-y-3 text-sm text-zt-muted">
          <p>{t.monitorIntro}</p>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <Link
                href={DASHBOARD_ROUTES.errors}
                className="font-medium text-zt-primary hover:underline"
              >
                {t.tabErrors}
              </Link>{" "}
              {t.monitorErrors}
            </li>
            <li>
              <Link
                href={DASHBOARD_ROUTES.health}
                className="font-medium text-zt-primary hover:underline"
              >
                {t.linkHealth}
              </Link>{" "}
              {t.monitorHealth}
            </li>
            <li>
              <Link
                href={DASHBOARD_ROUTES.insights}
                className="font-medium text-zt-primary hover:underline"
              >
                {t.linkInsights}
              </Link>{" "}
              {t.monitorInsights}
            </li>
            <li>
              <Link
                href={DASHBOARD_ROUTES.dashboard}
                className="inline-flex items-center gap-1 font-medium text-zt-primary hover:underline"
              >
                <LayoutDashboard className="size-3.5" aria-hidden />
                {t.linkOverview}
              </Link>{" "}
              {t.monitorOverview}
            </li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}
