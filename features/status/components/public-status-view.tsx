"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Search,
  Wrench,
  XCircle,
} from "lucide-react";

import { useDictionaryOptional } from "@/components/i18n/locale-provider";
import { dashEn } from "@/lib/i18n/dictionaries/dash-en";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import { CopyButton } from "@/components/dashboard/copy-button";
import {
  UPTIME_WINDOWS,
  type ComponentStatusValue,
  type UptimeWindowKey,
} from "@/lib/constants";
import { formatDateTime, formatDuration, formatRelativeTime } from "@/utils/format";
import type { PublicStatusPage } from "@/services/status";
import type {
  IncidentSeverity,
  IncidentStatus,
  StatusMaintenanceStatus,
} from "@/types/database";
import type { DashDictionary } from "@/lib/i18n/dictionaries/dash-types";

const statusMeta: Record<
  ComponentStatusValue,
  { className: string; Icon: typeof CheckCircle2; tone: BadgeProps["tone"] }
> = {
  operational: {
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    Icon: CheckCircle2,
    tone: "success",
  },
  degraded: {
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    Icon: AlertTriangle,
    tone: "warning",
  },
  partial_outage: {
    className: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    Icon: AlertTriangle,
    tone: "warning",
  },
  major_outage: {
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    Icon: XCircle,
    tone: "danger",
  },
  maintenance: {
    className: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    Icon: Wrench,
    tone: "primary",
  },
};

const UPTIME_WINDOW_DICT_KEYS: Record<
  UptimeWindowKey,
  "h24" | "d7" | "d30" | "d90"
> = {
  "24h": "h24",
  "7d": "d7",
  "30d": "d30",
  "90d": "d90",
};

const dayBarClass: Record<string, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
  no_data: "bg-zt-border",
};

const severityTone: Record<IncidentSeverity, BadgeProps["tone"]> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "default",
};

const incidentStatusTone: Record<IncidentStatus, BadgeProps["tone"]> = {
  investigating: "danger",
  identified: "warning",
  monitoring: "primary",
  resolved: "success",
};

const maintenanceTone: Record<StatusMaintenanceStatus, BadgeProps["tone"]> = {
  scheduled: "primary",
  in_progress: "warning",
  completed: "success",
  cancelled: "default",
};

const selectClass =
  "h-9 rounded-xl border border-zt-border bg-zt-surface px-3 text-sm text-zt-text focus:outline-none focus:ring-2 focus:ring-zt-primary/40";

interface PublicStatusViewProps {
  data: PublicStatusPage;
  shareUrl: string;
}

export function PublicStatusView({ data, shareUrl }: PublicStatusViewProps) {
  const localeCtx = useDictionaryOptional();
  const locale = localeCtx?.locale ?? "en";
  const t = localeCtx?.dict.dash.statusPages ?? dashEn.statusPages;
  const incidentsT = localeCtx?.dict.dash.incidents ?? dashEn.incidents;
  const meta = statusMeta[data.currentStatus];
  const overallLabel = t.banners[data.currentStatus];
  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "24h" | "7d" | "30d" | "90d">(
    "90d",
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const brand = data.brandColor || "#3B82F6";

  const filteredIncidents = useMemo(() => {
    const now = Date.now();
    const windowMs =
      timeFilter === "all" ? null : UPTIME_WINDOWS[timeFilter as UptimeWindowKey];
    return data.incidents.filter((incident) => {
      if (windowMs && now - Date.parse(incident.startedAt) > windowMs) {
        return false;
      }
      if (statusFilter === "active" && incident.status === "resolved") return false;
      if (statusFilter === "resolved" && incident.status !== "resolved") return false;
      if (severityFilter !== "all" && incident.severity !== severityFilter) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${incident.title} ${incident.projectName} ${incident.startedAt}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data.incidents, query, timeFilter, statusFilter, severityFilter]);

  const responseMax = Math.max(
    1,
    ...data.responseSeries.map((point) => point.avgMs ?? 0),
  );

  async function download(format: "csv" | "json") {
    const response = await fetch(
      `/api/status/${encodeURIComponent(data.slug)}/export?format=${format}`,
    );
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `status-${data.slug}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main
      className="min-h-screen bg-zt-bg text-zt-text"
      style={{ ["--status-brand" as string]: brand }}
    >
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-14">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.logoUrl}
                alt={fillTemplate(t.logoAlt, { name: data.name })}
                className="size-12 rounded-xl border border-zt-border object-cover"
              />
            ) : (
              <div
                className="flex size-12 items-center justify-center rounded-xl border border-zt-border"
                style={{ backgroundColor: `${brand}22`, color: brand }}
                aria-hidden
              >
                <Activity className="size-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-zt-muted">
                {data.projectName}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {data.name}
              </h1>
              {data.description ? (
                <p className="mt-1 text-sm text-zt-muted">{data.description}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={shareUrl} label={t.copyLink} />
            <button
              type="button"
              onClick={() => download("csv")}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zt-border px-3 text-sm text-zt-muted transition-colors hover:text-zt-text"
            >
              <Download className="size-3.5" aria-hidden />
              {t.exportCsv}
            </button>
            <button
              type="button"
              onClick={() => download("json")}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zt-border px-3 text-sm text-zt-muted transition-colors hover:text-zt-text"
            >
              <Download className="size-3.5" aria-hidden />
              {t.exportJson}
            </button>
          </div>
        </header>

        <div
          role="status"
          aria-live="polite"
          className={`mb-8 flex items-center gap-3 rounded-2xl border px-5 py-4 ${meta.className}`}
        >
          <meta.Icon className="size-6 shrink-0" aria-hidden />
          <div>
            <p className="text-base font-semibold">{overallLabel}</p>
            <p className="text-xs opacity-80">
              {t.currentUptime} {data.currentUptime.toFixed(2)}% ·{" "}
              {fillTemplate(t.updatedBanner, {
                rel: formatRelativeTime(data.updatedAt, undefined, locale),
                timezone: data.timezone,
              })}
            </p>
          </div>
        </div>

        <section aria-labelledby="uptime-heading" className="mb-8">
          <h2 id="uptime-heading" className="mb-3 text-sm font-semibold">
            {t.availability}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(UPTIME_WINDOWS) as UptimeWindowKey[]).map((key, index) => (
              <div
                key={key}
                className="rounded-2xl border border-zt-border bg-zt-surface p-4 transition-transform duration-500"
                style={{ animation: `statusFadeIn 420ms ease ${index * 60}ms both` }}
              >
                <p className="text-xs text-zt-muted">
                  {t.uptimeWindows[UPTIME_WINDOW_DICT_KEYS[key]]}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {data.uptime[key].toFixed(2)}
                  <span className="text-sm text-zt-muted">%</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="history-heading"
          className="mb-8 rounded-2xl border border-zt-border bg-zt-surface p-5"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="history-heading" className="text-sm font-semibold">
              {t.historicalUptime}
            </h2>
            <span className="text-xs text-zt-muted">
              {data.avgResponseMs !== null
                ? fillTemplate(t.avgResponse, { ms: data.avgResponseMs })
                : t.noResponse}
            </span>
          </div>
          <ul className="flex h-10 items-end gap-[2px]" aria-label={t.uptimeHistoryAria}>
            {data.history.map((point, index) => (
              <li
                key={point.date}
                className="group relative flex-1"
                style={{ animation: `statusGrow 500ms ease ${index * 4}ms both` }}
              >
                <button
                  type="button"
                  title={fillTemplate(t.dayUptimeTitle, {
                    date: point.date,
                    percent: point.uptimePercent.toFixed(2),
                  })}
                  aria-label={fillTemplate(t.dayUptimeAria, {
                    date: point.date,
                    status: point.status.replace("_", " "),
                    percent: point.uptimePercent.toFixed(2),
                  })}
                  className={`block w-full rounded-[2px] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-brand)] ${dayBarClass[point.status]}`}
                  style={{
                    height: `${Math.max(18, Math.round(point.uptimePercent * 0.32))}px`,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="response-heading"
          className="mb-8 rounded-2xl border border-zt-border bg-zt-surface p-5"
        >
          <h2 id="response-heading" className="mb-3 text-sm font-semibold">
            {t.responseTime}
          </h2>
          <div className="relative h-32 w-full overflow-hidden rounded-xl bg-zt-surface-2/40 p-2">
            <svg
              viewBox="0 0 100 40"
              className="h-full w-full"
              role="img"
              aria-label={t.responseChartAria}
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke={brand}
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={data.responseSeries
                  .map((point, index) => {
                    const x =
                      data.responseSeries.length <= 1
                        ? 0
                        : (index / (data.responseSeries.length - 1)) * 100;
                    const y =
                      point.avgMs === null
                        ? 38
                        : 38 - (point.avgMs / responseMax) * 34;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                style={{
                  strokeDasharray: 400,
                  animation: "statusDraw 1.2s ease forwards",
                }}
              />
            </svg>
          </div>
        </section>

        <section
          aria-labelledby="components-heading"
          className="mb-8 rounded-2xl border border-zt-border bg-zt-surface p-5"
        >
          <h2 id="components-heading" className="mb-3 text-sm font-semibold">
            {t.components}
          </h2>
          <ul className="divide-y divide-zt-border">
            {data.components.map((component) => (
              <li
                key={component.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{component.name}</p>
                  {component.description ? (
                    <p className="text-xs text-zt-muted">{component.description}</p>
                  ) : null}
                </div>
                <Badge tone={statusMeta[component.status].tone}>
                  {t.componentStatuses[component.status]}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        {data.upcomingMaintenance.length > 0 ? (
          <section
            aria-labelledby="maintenance-heading"
            className="mb-8 rounded-2xl border border-zt-border bg-zt-surface p-5"
          >
            <h2 id="maintenance-heading" className="mb-3 text-sm font-semibold">
              {t.maintenance}
            </h2>
            <ul className="space-y-3">
              {data.upcomingMaintenance.map((item) => (
                <li key={item.id} className="rounded-xl border border-zt-border px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge tone={maintenanceTone[item.status]}>{item.status}</Badge>
                  </div>
                  {item.description ? (
                    <p className="mt-1 text-xs text-zt-muted">{item.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-zt-muted">
                    {formatDateTime(item.scheduledStart)} →{" "}
                    {formatDateTime(item.scheduledEnd)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section
          aria-labelledby="active-heading"
          className="mb-8 rounded-2xl border border-zt-border bg-zt-surface p-5"
        >
          <h2 id="active-heading" className="mb-3 text-sm font-semibold">
            {t.currentIncidents}
          </h2>
          {data.activeIncidents.length === 0 ? (
            <p className="text-sm text-zt-muted">{t.noActiveIncidents}</p>
          ) : (
            <IncidentList
              incidents={data.activeIncidents}
              severityLabels={incidentsT.severities}
              statusLabels={incidentsT.statuses}
              labels={t}
            />
          )}
        </section>

        <section
          aria-labelledby="history-incidents-heading"
          className="rounded-2xl border border-zt-border bg-zt-surface p-5"
        >
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 id="history-incidents-heading" className="text-sm font-semibold">
              {t.incidentHistory}
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[12rem] flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zt-muted"
                  aria-hidden
                />
                <label className="sr-only" htmlFor="status-search">
                  {t.searchIncidentsLabel}
                </label>
                <input
                  id="status-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.searchIncidents}
                  className="h-9 w-full rounded-xl border border-zt-border bg-zt-bg pl-9 pr-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-[var(--status-brand)]"
                />
              </div>
              <select
                aria-label={t.filterByTime}
                className={selectClass}
                value={timeFilter}
                onChange={(event) =>
                  setTimeFilter(event.target.value as typeof timeFilter)
                }
              >
                <option value="24h">{t.filterLast24h}</option>
                <option value="7d">{t.filterLast7d}</option>
                <option value="30d">{t.filterLast30d}</option>
                <option value="90d">{t.filterLast90d}</option>
                <option value="all">{t.filterAllTime}</option>
              </select>
              <select
                aria-label={t.filterByStatus}
                className={selectClass}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">{t.filterStatusAll}</option>
                <option value="active">{t.filterStatusActive}</option>
                <option value="resolved">{t.filterStatusResolved}</option>
              </select>
              <select
                aria-label={t.filterBySeverity}
                className={selectClass}
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
              >
                <option value="all">{t.filterSeverityAll}</option>
                <option value="critical">{incidentsT.severities.critical}</option>
                <option value="high">{incidentsT.severities.high}</option>
                <option value="medium">{incidentsT.severities.medium}</option>
                <option value="low">{incidentsT.severities.low}</option>
              </select>
            </div>
          </div>
          {filteredIncidents.length === 0 ? (
            <p className="text-sm text-zt-muted">{t.noMatchingIncidents}.</p>
          ) : (
            <IncidentList
              incidents={filteredIncidents}
              severityLabels={incidentsT.severities}
              statusLabels={incidentsT.statuses}
              labels={t}
              showSeverityTone={severityTone}
              showStatusTone={incidentStatusTone}
            />
          )}
        </section>

        <footer className="mt-10 space-y-2 text-center text-xs text-zt-muted">
          {data.contactEmail ? (
            <p>
              {t.contact}{" "}
              <a
                href={`mailto:${data.contactEmail}`}
                className="text-[var(--status-brand)] underline-offset-2 hover:underline"
              >
                {data.contactEmail}
              </a>
            </p>
          ) : null}
          <p>
            {data.footerText?.trim() ||
              fillTemplate(t.defaultFooter, {
                date: formatDateTime(data.updatedAt),
                project: data.projectName,
              })}
          </p>
          <p>
            {fillTemplate(t.timezoneFooter, { timezone: data.timezone })}
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes statusFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes statusGrow {
          from { opacity: 0; transform: scaleY(0.4); transform-origin: bottom; }
          to { opacity: 1; transform: scaleY(1); transform-origin: bottom; }
        }
        @keyframes statusDraw {
          from { stroke-dashoffset: 400; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </main>
  );
}

function IncidentList({
  incidents,
  severityLabels,
  statusLabels,
  labels,
  showSeverityTone = severityTone,
  showStatusTone = incidentStatusTone,
}: {
  incidents: PublicStatusPage["incidents"];
  severityLabels: Record<IncidentSeverity, string>;
  statusLabels: Record<IncidentStatus, string>;
  labels: DashDictionary["statusPages"];
  showSeverityTone?: Record<IncidentSeverity, BadgeProps["tone"]>;
  showStatusTone?: Record<IncidentStatus, BadgeProps["tone"]>;
}) {
  return (
    <ul className="space-y-4">
      {incidents.map((incident) => (
        <li key={incident.id} className="border-l-2 border-zt-border pl-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{incident.title}</span>
            <Badge tone={showSeverityTone[incident.severity]}>
              {severityLabels[incident.severity]}
            </Badge>
            <Badge tone={showStatusTone[incident.status]}>
              {statusLabels[incident.status]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-zt-muted">
            {incident.projectName} ·{" "}
            {fillTemplate(labels.incidentStarted, {
              date: formatDateTime(incident.startedAt),
            })}
            {incident.resolvedAt
              ? ` · ${fillTemplate(labels.incidentResolved, {
                  date: formatDateTime(incident.resolvedAt),
                })}`
              : ""}
            {incident.recoverySeconds !== null
              ? ` · ${fillTemplate(labels.incidentRecovery, {
                  duration: formatDuration(incident.recoverySeconds),
                })}`
              : ""}
          </p>
          {incident.timeline.length > 0 ? (
            <ol className="mt-2 space-y-1 border-l border-zt-border pl-3">
              {incident.timeline.map((update) => (
                <li key={update.id} className="text-xs text-zt-muted">
                  <time dateTime={update.createdAt}>
                    {formatDateTime(update.createdAt)}
                  </time>
                  {" · "}
                  {update.message}
                </li>
              ))}
            </ol>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
