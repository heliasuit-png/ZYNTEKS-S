"use client";

import Link from "next/link";
import {
  Bot,
  Clock3,
  Download,
  ExternalLink,
  Link2,
  Siren,
} from "lucide-react";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { Badge } from "@/components/dashboard/badge";
import { CopyButton } from "@/components/dashboard/copy-button";
import { FadeIn } from "@/components/dashboard/motion";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { formatDateTime, formatRelativeTime } from "@/utils/format";
import { StackTracePanel } from "@/features/errors/components/stack-trace-panel";
import { ErrorTimeline } from "@/features/errors/components/error-timeline";
import {
  describeBrowser,
  describeDevice,
  describeOs,
  describeScreen,
} from "@/features/errors/lib/client-context";
import { ERROR_LEVEL_TONE } from "@/features/errors/lib/level-tone";
import type { ErrorDetailBundle } from "@/features/errors/types";

interface ErrorDetailViewProps {
  bundle: ErrorDetailBundle;
  shareUrl: string;
}

export function ErrorDetailView({ bundle, shareUrl }: ErrorDetailViewProps) {
  const { error, relatedErrors, relatedIncidents, timeline, apiKeyHints } =
    bundle;

  const browser = describeBrowser(error.browser);
  const os = describeOs(error.os);
  const device = describeDevice(error.device);
  const screen = describeScreen(error.screen);

  const exportJson = JSON.stringify(
    {
      id: error.id,
      message: error.message,
      type: error.type,
      level: error.level,
      stack: error.stack,
      fingerprint: error.fingerprint,
      occurrences: error.occurrences,
      url: error.url,
      environment: error.environment,
      release: error.release,
      projectId: error.projectId,
      projectName: error.projectName,
      framework: error.framework,
      browser: error.browser,
      os: error.os,
      device: error.device,
      screen: error.screen,
      language: error.language,
      timezone: error.timezone,
      sdkVersion: error.sdkVersion,
      firstSeenAt: error.firstSeenAt,
      lastSeenAt: error.lastSeenAt,
      relatedIncidents: relatedIncidents.map((i) => i.id),
      relatedErrors: relatedErrors.map((e) => e.id),
    },
    null,
    2,
  );

  const analyzeHref = `${DASHBOARD_ROUTES.aiAssistant}?intent=analyze-error&project=${error.projectId}&q=${encodeURIComponent(
    [
      `Analyze this error with root cause, recommendations, confidence, and related signals.`,
      ``,
      `Error ID: ${error.id}`,
      `Message: ${error.message}`,
      `Type: ${error.type ?? "n/a"}`,
      `Level: ${error.level}`,
      `Fingerprint: ${error.fingerprint}`,
      `Occurrences: ${error.occurrences}`,
      `Environment: ${error.environment}`,
      `Release: ${error.release ?? "n/a"}`,
      `URL: ${error.url ?? "n/a"}`,
      error.stack ? `\nStack:\n${error.stack.slice(0, 3500)}` : "",
    ].join("\n"),
  )}`;

  const primaryIncident = relatedIncidents[0];

  function downloadJson() {
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error-${error.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={ERROR_LEVEL_TONE[error.level]}>{error.level}</Badge>
          <Badge tone="default">{error.environment}</Badge>
          {error.type ? <Badge tone="default">{error.type}</Badge> : null}
          <span className="text-xs text-zt-muted">
            {error.occurrences} occurrence
            {error.occurrences === 1 ? "" : "s"} · first{" "}
            {formatRelativeTime(error.firstSeenAt)} · last{" "}
            {formatRelativeTime(error.lastSeenAt)}
          </span>
        </div>
      </FadeIn>

      <FadeIn delay={0.03}>
        <div className="flex flex-wrap gap-2">
          <Link
            href={analyzeHref}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zt-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-zt-primary/90"
          >
            <Bot className="size-3.5" aria-hidden />
            Analyze with AI
          </Link>
          <a
            href="#timeline"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
          >
            <Clock3 className="size-3.5" aria-hidden />
            View Timeline
          </a>
          {primaryIncident ? (
            <Link
              href={`${DASHBOARD_ROUTES.incidents}/${primaryIncident.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
            >
              <Siren className="size-3.5" aria-hidden />
              Open Incident
            </Link>
          ) : (
            <Link
              href={DASHBOARD_ROUTES.incidents}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
            >
              <Siren className="size-3.5" aria-hidden />
              Open Incident
            </Link>
          )}
          <CopyButton value={shareUrl} label="Share Error" />
          <button
            type="button"
            onClick={downloadJson}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
          >
            <Download className="size-3.5" aria-hidden />
            Download JSON
          </button>
          <CopyButton value={exportJson} label="Copy JSON" />
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Panel>
          <PanelHeader>
            <PanelTitle>Details</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Message" value={error.message} wide />
              <Field label="Occurrences" value={String(error.occurrences)} />
              <Field
                label="First Seen"
                value={formatDateTime(error.firstSeenAt)}
              />
              <Field
                label="Last Seen"
                value={formatDateTime(error.lastSeenAt)}
              />
              <Field label="Environment" value={error.environment} />
              <Field label="Release" value={error.release ?? "—"} />
              <Field label="Framework" value={error.framework ?? "—"} />
              <Field label="Browser" value={browser ?? "—"} />
              <Field label="Operating System" value={os ?? "—"} />
              <Field label="Device" value={device ?? "—"} />
              <Field label="Screen Resolution" value={screen ?? "—"} />
              <Field label="Language" value={error.language ?? "—"} />
              <Field label="Timezone" value={error.timezone ?? "—"} />
              <Field label="SDK Version" value={error.sdkVersion ?? "Not reported"} />
              <Field label="Project" value={error.projectName} />
              <Field
                label="URL"
                value={error.url ?? "—"}
                mono
              />
              <Field label="Fingerprint" value={error.fingerprint} mono />
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-xs text-zt-muted">API Key</dt>
                <dd className="mt-1 text-sm text-zt-text">
                  {apiKeyHints.length === 0 ? (
                    "Authenticated via project SDK key (no active keys listed)."
                  ) : (
                    <ul className="space-y-1">
                      {apiKeyHints.map((hint) => (
                        <li key={hint} className="font-mono text-xs text-zt-muted">
                          {hint}
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zt-muted">Related Incident</dt>
                <dd className="mt-1 text-sm text-zt-text">
                  {primaryIncident ? (
                    <Link
                      href={`${DASHBOARD_ROUTES.incidents}/${primaryIncident.id}`}
                      className="inline-flex items-center gap-1 text-zt-primary hover:underline"
                    >
                      {primaryIncident.title}
                      <ExternalLink className="size-3" aria-hidden />
                    </Link>
                  ) : (
                    "None in the surrounding time window"
                  )}
                </dd>
              </div>
            </dl>
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.07}>
        <Panel>
          <PanelHeader>
            <PanelTitle>Stack Trace</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <StackTracePanel stack={error.stack} />
          </PanelContent>
        </Panel>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.09}>
          <Panel className="h-full" id="timeline">
            <PanelHeader>
              <PanelTitle>Timeline</PanelTitle>
            </PanelHeader>
            <PanelContent>
              <ErrorTimeline events={timeline} />
            </PanelContent>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.11}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>Related Incidents</PanelTitle>
            </PanelHeader>
            <PanelContent>
              {relatedIncidents.length === 0 ? (
                <EmptyState
                  icon={Siren}
                  title="No related incidents"
                  description="Incidents opened near this error’s last occurrence will show here."
                />
              ) : (
                <ul className="space-y-3">
                  {relatedIncidents.map((incident) => (
                    <li key={incident.id}>
                      <Link
                        href={`${DASHBOARD_ROUTES.incidents}/${incident.id}`}
                        className="block rounded-xl border border-zt-border px-3 py-2.5 transition-colors hover:border-zt-border-strong hover:bg-white/[0.03]"
                      >
                        <p className="text-sm font-medium text-zt-text">
                          {incident.title}
                        </p>
                        <p className="mt-0.5 text-xs text-zt-muted">
                          {incident.severity} · {incident.status} ·{" "}
                          {formatRelativeTime(incident.startedAt)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </PanelContent>
          </Panel>
        </FadeIn>
      </div>

      <FadeIn delay={0.13}>
        <Panel>
          <PanelHeader>
            <PanelTitle>Related Errors</PanelTitle>
          </PanelHeader>
          <PanelContent>
            {relatedErrors.length === 0 ? (
              <EmptyState
                icon={Link2}
                title="No related errors"
                description="Other groups with the same fingerprint or type will appear here."
              />
            ) : (
              <ul className="divide-y divide-zt-border">
                {relatedErrors.map((related) => (
                  <li key={related.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`${DASHBOARD_ROUTES.errors}/${related.id}`}
                      className="flex items-start justify-between gap-3 transition-colors hover:text-zt-primary"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zt-text">
                          {related.message}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-zt-muted">
                          {related.fingerprint.slice(0, 20)}… ·{" "}
                          {related.occurrences}× ·{" "}
                          {formatRelativeTime(related.lastSeenAt)}
                        </p>
                      </div>
                      <Badge tone={ERROR_LEVEL_TONE[related.level]}>
                        {related.level}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Panel>
          <PanelHeader>
            <PanelTitle>AI Analysis</PanelTitle>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <p className="text-sm text-zt-muted">
              Open the assistant with this error’s context preloaded — root
              cause, recommendations, confidence, and related signals.
            </p>
            <Link
              href={analyzeHref}
              className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
            >
              <Bot className="size-4" aria-hidden />
              Analyze Error
            </Link>
          </PanelContent>
        </Panel>
      </FadeIn>
    </div>
  );
}

function Field({
  label,
  value,
  wide,
  mono,
}: {
  label: string;
  value: string;
  wide?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <dt className="text-xs text-zt-muted">{label}</dt>
      <dd
        className={
          mono
            ? "mt-1 break-all font-mono text-xs text-zt-text"
            : "mt-1 break-words text-sm text-zt-text"
        }
      >
        {value}
      </dd>
    </div>
  );
}
