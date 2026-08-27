"use client";

import Link from "next/link";
import { Bot, Download, ExternalLink, Siren } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { Badge } from "@/components/dashboard/badge";
import { CopyButton } from "@/components/dashboard/copy-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FadeIn } from "@/components/dashboard/motion";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { formatDateTime, formatDuration, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import { IncidentUpdateForm } from "@/features/incidents/components/incident-update-form";
import {
  INCIDENT_SEVERITY_TONE,
  INCIDENT_STATUS_TONE,
} from "@/features/incidents/lib/status";
import type { IncidentDetailBundle } from "@/features/incidents/types";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";

const timelineTone: Record<
  IncidentDetailBundle["timeline"][number]["tone"],
  string
> = {
  danger: "bg-zt-danger",
  warning: "bg-zt-warning",
  primary: "bg-zt-primary",
  success: "bg-zt-success",
  default: "bg-zt-muted",
};

interface IncidentDetailViewProps {
  bundle: IncidentDetailBundle;
  shareUrl: string;
}

export function IncidentDetailView({
  bundle,
  shareUrl,
}: IncidentDetailViewProps) {
  const { dict, locale } = useDictionary();
  const t = dict.dash.incidents;
  const common = dict.dashboardCommon;
  const { incident, rootCause, recovery, timeline } = bundle;

  const exportJson = JSON.stringify(
    {
      ...incident,
      rootCause,
      recovery,
      relatedErrors: bundle.relatedErrors.map((e) => e.id),
      relatedHeartbeats: bundle.relatedHeartbeats.map((h) => h.id),
      relatedNotifications: bundle.relatedNotifications.map((n) => n.id),
      updates: bundle.updates,
    },
    null,
    2,
  );

  function downloadJson() {
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident-${incident.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const downtimeText =
    recovery.downtimeSeconds != null
      ? formatDuration(recovery.downtimeSeconds)
      : formatDuration(
          Math.floor(
            (Date.now() - new Date(incident.startedAt).getTime()) / 1000,
          ),
        );

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={INCIDENT_SEVERITY_TONE[incident.severity]}>
            {t.severities[incident.severity as IncidentSeverity]}
          </Badge>
          <Badge tone={INCIDENT_STATUS_TONE[incident.status]}>
            {t.statuses[incident.status as IncidentStatus]}
          </Badge>
          <Badge tone="default">{incident.source}</Badge>
          {incident.environment ? (
            <Badge tone="default">{incident.environment}</Badge>
          ) : null}
        </div>
      </FadeIn>

      <FadeIn delay={0.03}>
        <div className="flex flex-wrap gap-2">
          <Link
            href={bundle.aiAnalyzeHref}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zt-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-zt-primary/90"
          >
            <Bot className="size-3.5" aria-hidden />
            {t.aiAnalysis}
          </Link>
          <CopyButton value={shareUrl} label={t.copyLink} />
          <CopyButton value={exportJson} label={t.copyJson} />
          <button
            type="button"
            onClick={downloadJson}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
          >
            <Download className="size-3.5" aria-hidden />
            {t.downloadJson}
          </button>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Panel>
          <PanelContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label={t.project} value={incident.projectName} />
              <Field label={t.assignee} value={incident.assignee} />
              <Field
                label={t.started}
                value={formatDateTime(incident.startedAt)}
              />
              <Field
                label={t.resolved}
                value={
                  incident.resolvedAt
                    ? formatDateTime(incident.resolvedAt)
                    : "—"
                }
              />
              <Field
                label={incident.resolvedAt ? t.downtime : t.elapsed}
                value={downtimeText}
              />
              <Field
                label={t.recoveryTime}
                value={
                  recovery.recoverySeconds != null
                    ? formatDuration(recovery.recoverySeconds)
                    : "—"
                }
              />
              <Field
                label={t.avgRecovery}
                value={
                  recovery.averageRecoverySeconds != null
                    ? formatDuration(recovery.averageRecoverySeconds)
                    : "—"
                }
              />
              <Field
                label={t.historicalRecoveries}
                value={String(recovery.historicalCount)}
              />
              <Field
                label={t.lastHeartbeat}
                value={
                  incident.lastHeartbeatAt
                    ? formatDateTime(incident.lastHeartbeatAt)
                    : "—"
                }
              />
              <Field
                label={t.detected}
                value={formatDateTime(incident.detectedAt)}
              />
              <Field
                label={t.autoResolved}
                value={incident.autoResolved ? common.yes : common.no}
              />
              <Field
                label={t.environment}
                value={incident.environment ?? "—"}
              />
            </dl>
          </PanelContent>
        </Panel>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.07}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>{t.rootCause}</PanelTitle>
            </PanelHeader>
            <PanelContent className="space-y-4">
              <div>
                <p className="text-xs text-zt-muted">{t.possibleCause}</p>
                <p className="mt-1 text-sm text-zt-text">
                  {rootCause.possibleCause}
                </p>
              </div>
              <div>
                <p className="text-xs text-zt-muted">{t.confidence}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zt-text">
                  {rootCause.confidence}%
                </p>
              </div>
              <ListBlock title={t.evidence} items={rootCause.evidence} />
              <ListBlock
                title={t.relatedEvents}
                items={rootCause.relatedEvents}
              />
              <ListBlock
                title={t.recommendations}
                items={rootCause.recommendations}
              />
            </PanelContent>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.09}>
          <Panel className="h-full" id="timeline">
            <PanelHeader>
              <PanelTitle>{t.timeline}</PanelTitle>
            </PanelHeader>
            <PanelContent className="space-y-4">
              {incident.status !== "resolved" ? (
                <IncidentUpdateForm
                  incidentId={incident.id}
                  currentStatus={incident.status}
                />
              ) : (
                <p className="rounded-lg border border-zt-success/30 bg-zt-success/10 px-3 py-2 text-xs text-zt-success">
                  {t.resolvedClosed}
                </p>
              )}
              {timeline.length === 0 ? (
                <p className="text-sm text-zt-muted">{t.noTimelineEvents}</p>
              ) : (
                <ol className="relative max-h-[28rem] space-y-4 overflow-y-auto border-l border-zt-border pl-5">
                  {timeline.map((event) => (
                    <li key={event.id} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[23px] top-1.5 size-2.5 rounded-full ring-4 ring-zt-bg",
                          timelineTone[event.tone],
                        )}
                        aria-hidden
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="default">{event.kind}</Badge>
                        <span className="text-xs text-zt-muted">
                          {formatDateTime(event.at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-zt-text">
                        {event.title}
                      </p>
                      {event.detail ? (
                        <p className="mt-0.5 text-xs text-zt-muted">
                          {event.detail}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </PanelContent>
          </Panel>
        </FadeIn>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RelationPanel
          title={t.relatedErrors}
          empty={t.emptyRelatedErrors}
          delay={0.11}
          isEmpty={bundle.relatedErrors.length === 0}
        >
          {bundle.relatedErrors.map((err) => (
            <Link
              key={err.id}
              href={`${DASHBOARD_ROUTES.errors}/${err.id}`}
              className="block rounded-xl border border-zt-border px-3 py-2.5 transition-colors hover:border-zt-border-strong hover:bg-white/[0.03]"
            >
              <p className="truncate text-sm font-medium text-zt-text">
                {err.message}
              </p>
              <p className="mt-0.5 text-xs text-zt-muted">
                {err.level} · {err.occurrences}× ·{" "}
                {formatRelativeTime(err.lastSeenAt, undefined, locale)}
              </p>
            </Link>
          ))}
        </RelationPanel>

        <RelationPanel
          title={t.relatedHeartbeats}
          empty={t.emptyRelatedHeartbeats}
          delay={0.12}
          isEmpty={bundle.relatedHeartbeats.length === 0}
        >
          {bundle.relatedHeartbeats.map((hb) => (
            <div
              key={hb.id}
              className="rounded-xl border border-zt-border px-3 py-2.5"
            >
              <p className="text-sm font-medium text-zt-text">
                {formatDateTime(hb.occurredAt)}
              </p>
              <p className="mt-0.5 text-xs text-zt-muted">
                {hb.environment}
                {hb.release ? ` · ${hb.release}` : ""}
                {hb.page ? ` · ${hb.page}` : ""}
              </p>
            </div>
          ))}
        </RelationPanel>

        <RelationPanel
          title={t.relatedNotifications}
          empty={t.emptyRelatedNotifications}
          delay={0.13}
          isEmpty={bundle.relatedNotifications.length === 0}
        >
          {bundle.relatedNotifications.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-zt-border px-3 py-2.5"
            >
              <p className="text-sm font-medium text-zt-text">{n.title}</p>
              <p className="mt-0.5 text-xs text-zt-muted">
                {n.type} · {n.channel} · {formatRelativeTime(n.createdAt, undefined, locale)}
              </p>
            </div>
          ))}
        </RelationPanel>

        <RelationPanel
          title={t.performance}
          empty={t.emptyRelatedPerformance}
          delay={0.14}
          isEmpty={bundle.relatedPerformance.length === 0}
        >
          {bundle.relatedPerformance.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-zt-border px-3 py-2.5"
            >
              <p className="truncate text-sm font-medium text-zt-text">
                {p.url ?? t.pageSample}
              </p>
              <p className="mt-0.5 text-xs text-zt-muted">
                {p.lcp != null ? `LCP ${Math.round(p.lcp)}ms` : "LCP —"}
                {p.ttfb != null ? ` · TTFB ${Math.round(p.ttfb)}ms` : ""}
                {p.pageLoad != null
                  ? ` · Load ${Math.round(p.pageLoad)}ms`
                  : ""}
              </p>
            </div>
          ))}
        </RelationPanel>

        <RelationPanel
          title={t.apiKeys}
          empty={t.emptyRelatedApiKeys}
          delay={0.15}
          isEmpty={bundle.relatedApiKeys.length === 0}
        >
          {bundle.relatedApiKeys.map((k) => (
            <div
              key={k.id}
              className="rounded-xl border border-zt-border px-3 py-2.5"
            >
              <p className="text-sm font-medium text-zt-text">{k.name}</p>
              <p className="mt-0.5 font-mono text-xs text-zt-muted">
                {k.prefix}… · {k.environment}
                {k.lastUsedAt
                  ? ` · ${t.lastUsed} ${formatRelativeTime(k.lastUsedAt, undefined, locale)}`
                  : ""}
              </p>
            </div>
          ))}
        </RelationPanel>

        <FadeIn delay={0.16}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>{t.aiAnalysis}</PanelTitle>
            </PanelHeader>
            <PanelContent className="space-y-2">
              {bundle.relatedAi.length === 0 ? (
                <p className="text-sm text-zt-muted">{t.noAiConversations}</p>
              ) : (
                bundle.relatedAi.map((c) => (
                  <Link
                    key={c.id}
                    href={`${DASHBOARD_ROUTES.aiAssistant}?c=${c.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-zt-border px-3 py-2.5 transition-colors hover:border-zt-border-strong"
                  >
                    <div>
                      <p className="text-sm font-medium text-zt-text">
                        {c.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zt-muted">
                        {formatRelativeTime(c.updatedAt, undefined, locale)}
                      </p>
                    </div>
                    <ExternalLink
                      className="size-3.5 text-zt-muted"
                      aria-hidden
                    />
                  </Link>
                ))
              )}
              <Link
                href={bundle.aiAnalyzeHref}
                className="inline-flex items-center gap-2 text-sm font-medium text-zt-primary hover:underline"
              >
                <Bot className="size-4" aria-hidden />
                {t.analyzeThisIncident}
              </Link>
            </PanelContent>
          </Panel>
        </FadeIn>
      </div>

      <FadeIn delay={0.18}>
        <Panel>
          <PanelHeader>
            <PanelTitle>{t.historyComments}</PanelTitle>
          </PanelHeader>
          <PanelContent>
            {bundle.updates.length === 0 ? (
              <EmptyState
                icon={Siren}
                title={t.noUpdatesYet}
                description={t.noUpdatesYetDesc}
              />
            ) : (
              <ul className="space-y-3">
                {bundle.updates.map((update) => (
                  <li
                    key={update.id}
                    className="rounded-xl border border-zt-border px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {update.status ? (
                        <Badge tone={INCIDENT_STATUS_TONE[update.status]}>
                          {t.statuses[update.status as IncidentStatus]}
                        </Badge>
                      ) : (
                        <Badge tone="default">{t.comment}</Badge>
                      )}
                      <span className="text-xs text-zt-muted">
                        {formatDateTime(update.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zt-text">{update.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </PanelContent>
        </Panel>
      </FadeIn>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zt-muted">{label}</dt>
      <dd className="mt-1 text-sm text-zt-text">{value}</dd>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs text-zt-muted">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zt-text">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function RelationPanel({
  title,
  empty,
  delay,
  isEmpty,
  children,
}: {
  title: string;
  empty: string;
  delay: number;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <FadeIn delay={delay}>
      <Panel className="h-full">
        <PanelHeader>
          <PanelTitle>{title}</PanelTitle>
        </PanelHeader>
        <PanelContent className="space-y-2">
          {isEmpty ? (
            <p className="text-sm text-zt-muted">{empty}</p>
          ) : (
            children
          )}
        </PanelContent>
      </Panel>
    </FadeIn>
  );
}
