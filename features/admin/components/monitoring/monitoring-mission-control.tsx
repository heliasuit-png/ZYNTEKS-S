"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useDictionary } from "@/components/i18n/locale-provider";
import { fillTemplate } from "@/lib/i18n/fill-template";
import type { MonitoringMissionData } from "@/services/admin/monitoring-mission.types";
import type { HealthTone } from "@/services/admin/executive-dashboard.types";
import { HealthDot } from "@/features/admin/components/executive/health-dot";
import {
  formatMs,
  formatNumber,
  formatPercent,
  formatRelative,
  formatWhen,
} from "@/features/admin/components/executive/format";
import { MonitoringFilters } from "@/features/admin/components/monitoring/monitoring-filters";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-header";
import { AdminEmptyState } from "@/features/admin/components/ui/admin-empty-state";
import { ADMIN_KPI_STAGGER } from "@/features/admin/components/ui/admin-motion";

function WorldMapLoading() {
  const { dict } = useDictionary();
  return (
    <div
      className="admin-skeleton h-72 w-full"
      aria-label={dict.admin.monitoring.loadingMap}
    />
  );
}

const WorldMap = dynamic(
  () =>
    import("@/features/admin/components/monitoring/world-map").then(
      (mod) => mod.WorldMap,
    ),
  {
    ssr: false,
    loading: () => <WorldMapLoading />,
  },
);

const REFRESH_MS = 20_000;

const TONE_TEXT: Record<HealthTone, string> = {
  green: "text-emerald-300",
  yellow: "text-amber-300",
  red: "text-rose-300",
};

const KIND_COLOR: Record<string, string> = {
  error: "bg-rose-400",
  heartbeat: "bg-emerald-400",
  performance: "bg-sky-400",
  incident: "bg-amber-400",
  notification: "bg-violet-400",
  api_key: "bg-[var(--admin-accent)]",
  workspace: "bg-indigo-400",
  ai: "bg-fuchsia-400",
};

export function MonitoringMissionControl({
  data,
}: {
  data: MonitoringMissionData;
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.monitoring;
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const refresh = window.setInterval(() => {
      router.refresh();
      setNow(Date.now());
    }, REFRESH_MS);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(refresh);
      window.clearInterval(tick);
    };
  }, [router]);

  const secondsToRefresh = Math.max(
    0,
    Math.ceil((REFRESH_MS - ((now - new Date(data.generatedAt).getTime()) % REFRESH_MS)) / 1000),
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow={t.eyebrow}
        title={t.pageTitle}
        description={t.description}
        actions={
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wide text-[var(--admin-muted)]">
              {t.autoRefresh}
            </p>
            <p className="text-sm text-[var(--admin-accent-text)]">
              {fillTemplate(t.refreshCountdown, {
                seconds: String(secondsToRefresh),
                when: formatRelative(data.generatedAt, locale),
              })}
            </p>
          </div>
        }
      />

      <GlobalStatus data={data} />
      <MonitoringFilters options={data.filterOptions} />
      <LiveMetricsRow metrics={data.liveMetrics} />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <EventStream stream={data.stream} />
        <WorldMap geography={data.geography} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <HealthOverview health={data.health} />
        <IncidentPanel incidents={data.incidents} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ErrorAnalytics errors={data.errors} />
        <PerformancePanel performance={data.performance} metrics={data.liveMetrics} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SdkOverview sdk={data.sdk} />
        <CronCenter cron={data.cron} />
        <AlertCenter alerts={data.alerts} />
      </div>

      {data.unavailable.length > 0 ? (
        <p className="text-[11px] text-[var(--admin-muted)]">
          {fillTemplate(t.honestGaps, {
            items: data.unavailable.join(" · "),
          })}
        </p>
      ) : null}
    </div>
  );
}

function GlobalStatus({ data }: { data: MonitoringMissionData }) {
  const { dict } = useDictionary();
  const t = dict.admin.monitoring;
  const tone = data.globalStatus.platformTone;
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border px-4 py-4 ${
        tone === "green"
          ? "border-emerald-400/25 bg-[linear-gradient(120deg,rgba(16,185,129,0.14),rgba(8,16,28,0.85))]"
          : tone === "yellow"
            ? "border-amber-400/25 bg-[linear-gradient(120deg,rgba(245,158,11,0.14),rgba(8,16,28,0.85))]"
            : "border-rose-400/25 bg-[linear-gradient(120deg,rgba(244,63,94,0.16),rgba(8,16,28,0.85))]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(59,130,246,0.12),transparent_45%)]" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                tone === "green"
                  ? "bg-emerald-400"
                  : tone === "yellow"
                    ? "bg-amber-300"
                    : "bg-rose-400"
              }`}
            />
            <HealthDot tone={tone} />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--admin-muted)]">
              {t.platformStatus}
            </p>
            <p className={`text-xl font-semibold ${TONE_TEXT[tone]}`}>
              {t.platformLabels[tone]}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-[var(--admin-muted)]">
          <Stat
            label={t.responseTime}
            value={formatMs(data.globalStatus.responseTimeMs)}
          />
          <Stat
            label={t.uptime30d}
            value={formatPercent(data.globalStatus.uptimePercent30d)}
          />
        </div>
      </div>
      <div className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9">
        {data.globalStatus.probes.map((probe) => {
          const detailTemplate =
            t.probeDetails[
              probe.detailKey as keyof typeof t.probeDetails
            ] ?? probe.detailKey;
          const detail = probe.detailParams
            ? fillTemplate(detailTemplate, probe.detailParams)
            : detailTemplate;
          return (
          <article
            key={probe.id}
            className="rounded-xl border border-[var(--admin-border)] bg-black/20 px-2.5 py-2"
          >
            <div className="flex items-center gap-1.5">
              <HealthDot tone={probe.tone} />
              <p className="text-[11px] font-medium text-[var(--admin-text)]">
                {t.probes[probe.id]}
              </p>
            </div>
            <p className="mt-1 line-clamp-2 text-[10px] text-[var(--admin-muted)]">
              {detail}
            </p>
          </article>
          );
        })}
      </div>
    </section>
  );
}

function LiveMetricsRow({
  metrics,
}: {
  metrics: MonitoringMissionData["liveMetrics"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.monitoring;
  const cards = [
    { label: t.metrics.apiReqSec, value: metrics.apiRequestsPerSec.toFixed(2) },
    { label: t.metrics.errorsMin, value: metrics.errorsPerMin.toFixed(2) },
    {
      label: t.metrics.heartbeatsMin,
      value: metrics.heartbeatsPerMin.toFixed(2),
    },
    { label: t.metrics.aiReqMin, value: metrics.aiRequestsPerMin.toFixed(2) },
    {
      label: t.metrics.avgResponse,
      value: formatMs(metrics.averageResponseTimeMs),
    },
    {
      label: t.metrics.dbLatency,
      value: formatMs(metrics.databaseLatencyMs),
    },
    {
      label: t.metrics.memorySdk,
      value:
        metrics.memoryMbAvg == null
          ? "—"
          : `${metrics.memoryMbAvg.toFixed(1)} MB`,
    },
    { label: t.cpu, value: t.notAvailable },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      {cards.map((card, index) => (
        <motion.article
          key={card.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * ADMIN_KPI_STAGGER, duration: 0.22 }}
          className="admin-glass admin-panel rounded-2xl px-3 py-3"
        >
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            {card.label}
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--admin-text)]">
            {card.value}
          </p>
        </motion.article>
      ))}
    </div>
  );
}

function EventStream({
  stream,
}: {
  stream: MonitoringMissionData["stream"];
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.monitoring;
  return (
    <Panel title={t.liveStream} subtitle={t.liveStreamDesc}>
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {stream.length === 0 ? (
          <AdminEmptyState title={t.liveStreamEmpty} />
        ) : (
          stream.map((event) => (
            <div
              key={event.id}
              className="flex gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2"
            >
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${KIND_COLOR[event.kind] ?? "bg-slate-400"}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-sm text-[var(--admin-text)]">
                    {event.title}
                  </p>
                  <time className="text-[10px] text-[var(--admin-muted)]">
                    {formatRelative(event.occurredAt, locale)}
                  </time>
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">
                  <span className="uppercase tracking-wide text-[var(--admin-accent-text)]">
                    {event.kind.replaceAll("_", " ")}
                  </span>
                  {" · "}
                  {event.detail}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function HealthOverview({
  health,
}: {
  health: MonitoringMissionData["health"];
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.monitoring;
  const buckets = [
    {
      key: "healthy" as const,
      label: t.healthStatuses.healthy,
      tone: "text-emerald-300",
    },
    {
      key: "warning" as const,
      label: t.healthStatuses.warning,
      tone: "text-amber-300",
    },
    {
      key: "critical" as const,
      label: t.healthStatuses.critical,
      tone: "text-rose-300",
    },
    {
      key: "offline" as const,
      label: t.healthStatuses.offline,
      tone: "text-slate-300",
    },
  ];

  return (
    <Panel title={t.healthOverview} subtitle={t.healthOverviewDesc}>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {buckets.map((bucket) => (
          <div
            key={bucket.key}
            className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-wide text-[var(--admin-muted)]">
              {bucket.label}
            </p>
            <p className={`text-xl font-semibold ${bucket.tone}`}>
              {health.counts[bucket.key]}
            </p>
          </div>
        ))}
      </div>
      <div className="max-h-72 space-y-1.5 overflow-y-auto">
        {health.projects.length === 0 ? (
          <Empty>{t.noProjectsInScope}</Empty>
        ) : (
          health.projects.map((project) => (
            <div
              key={project.projectId}
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate text-[var(--admin-text)]">{project.name}</p>
                <p className="truncate text-[10px] text-[var(--admin-muted)]">
                  {project.workspaceName}
                  {project.lastHeartbeatAt
                    ? ` · ${fillTemplate(t.heartbeatRelative, {
                        when: formatRelative(project.lastHeartbeatAt, locale),
                      })}`
                    : ` · ${t.noHeartbeat}`}
                </p>
              </div>
              <div className="text-right">
                <p className="capitalize text-[var(--admin-accent-text)]">
                  {project.status}
                </p>
                <p className="text-[10px] text-[var(--admin-muted)]">
                  {project.score == null
                    ? "—"
                    : fillTemplate(t.scoreValue, {
                        score: String(project.score),
                      })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function IncidentPanel({
  incidents,
}: {
  incidents: MonitoringMissionData["incidents"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.monitoring;
  return (
    <Panel title={t.incidentPanel} subtitle={t.incidentPanelDesc}>
      <IncidentGroup label={t.incidentOpen} items={incidents.open} />
      <IncidentGroup label={t.incidentMonitoring} items={incidents.monitoring} />
      <IncidentGroup label={t.incidentResolved} items={incidents.resolved} />
    </Panel>
  );
}

function IncidentGroup({
  label,
  items,
}: {
  label: string;
  items: MonitoringMissionData["incidents"]["open"];
}) {
  const { dict } = useDictionary();
  const common = dict.admin.common;
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {label} ({items.length})
      </p>
      {items.length === 0 ? (
        <Empty>{common.none}</Empty>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[var(--admin-text)]">{item.title}</p>
                <span className="uppercase text-amber-300">{item.severity}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-[var(--admin-muted)]">
                {item.workspaceName} · {item.projectName} ·{" "}
                {formatWhen(item.detectedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorAnalytics({
  errors,
}: {
  errors: MonitoringMissionData["errors"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.monitoring;
  const max = Math.max(1, ...errors.trend.map((p) => p.value));
  return (
    <Panel title={t.errorAnalytics} subtitle={t.errorAnalyticsDesc}>
      <div
        className="mb-3 flex h-16 items-end gap-0.5"
        role="img"
        aria-label={t.errorTrendAria}
      >
        {errors.trend.map((point) => (
          <div
            key={point.label}
            className="min-w-0 flex-1 rounded-t-sm bg-rose-400/80"
            style={{
              height: `${Math.max(6, (point.value / max) * 100)}%`,
              opacity: point.value === 0 ? 0.2 : 0.9,
            }}
            title={`${point.label}: ${point.value}`}
          />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <ErrorList title={t.topErrors} items={errors.top} />
        <ErrorList title={t.newestErrors} items={errors.newest} />
      </div>
    </Panel>
  );
}

function ErrorList({
  title,
  items,
}: {
  title: string;
  items: MonitoringMissionData["errors"]["top"];
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.monitoring;
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {title}
      </p>
      <div className="max-h-56 space-y-1.5 overflow-y-auto">
        {items.length === 0 ? (
          <Empty>{t.noErrors}</Empty>
        ) : (
          items.map((item) => (
            <div
              key={`${title}-${item.id}`}
              className="rounded-lg border border-rose-500/10 px-2.5 py-1.5 text-xs"
            >
              <p className="line-clamp-2 text-[var(--admin-text)]">{item.message}</p>
              <p className="mt-0.5 text-[10px] text-[var(--admin-muted)]">
                {item.level} · {item.occurrences}× · {item.projectName} ·{" "}
                {formatRelative(item.lastSeen, locale)}
              </p>
              {item.stackSummary ? (
                <p className="mt-0.5 truncate font-mono text-[10px] text-rose-200/70">
                  {item.stackSummary}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PerformancePanel({
  performance,
  metrics,
}: {
  performance: MonitoringMissionData["performance"];
  metrics: MonitoringMissionData["liveMetrics"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.monitoring;
  return (
    <Panel title={t.performance} subtitle={t.performanceDesc}>
      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <Stat label={t.avg} value={formatMs(metrics.averageResponseTimeMs)} />
        <Stat label={t.p95} value={formatMs(metrics.p95ResponseTimeMs)} />
        <Stat label={t.p99} value={formatMs(metrics.p99ResponseTimeMs)} />
      </div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {t.largestEndpoints}
      </p>
      <EndpointTable rows={performance.endpoints} />
      <p className="mb-1.5 mt-3 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {t.slowestRequests}
      </p>
      <EndpointTable rows={performance.slowest} />
    </Panel>
  );
}

function EndpointTable({
  rows,
}: {
  rows: MonitoringMissionData["performance"]["endpoints"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.monitoring;
  if (rows.length === 0) return <Empty>{t.noPerformanceSamples}</Empty>;
  return (
    <div className="max-h-40 space-y-1 overflow-y-auto">
      {rows.slice(0, 8).map((row) => (
        <div
          key={row.url}
          className="flex items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px]"
        >
          <span className="truncate text-[var(--admin-text)]">{row.url}</span>
          <span className="shrink-0 text-[var(--admin-muted)]">
            n={row.samples} · p95 {formatMs(row.p95Ms)} · p99 {formatMs(row.p99Ms)}
          </span>
        </div>
      ))}
    </div>
  );
}

function SdkOverview({ sdk }: { sdk: MonitoringMissionData["sdk"] }) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.monitoring;
  const common = dict.admin.common;
  return (
    <Panel title={t.sdkOverview} subtitle={t.sdkOverviewDesc}>
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <Stat
          label={common.envProduction}
          value={formatNumber(sdk.productionHeartbeats)}
        />
        <Stat
          label={common.envDevelopment}
          value={formatNumber(sdk.developmentHeartbeats)}
        />
        <Stat
          label={common.envStaging}
          value={formatNumber(sdk.stagingHeartbeats)}
        />
        <Stat
          label={t.silentProjects}
          value={formatNumber(sdk.silentProjects)}
        />
      </div>
      <div className="max-h-56 space-y-1.5 overflow-y-auto">
        {sdk.versions.length === 0 ? (
          <Empty>{t.noSdkVersions}</Empty>
        ) : (
          sdk.versions.map((row) => (
            <div
              key={`${row.release}-${row.environment}`}
              className="rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-xs"
            >
              <p className="text-[var(--admin-text)]">{row.release}</p>
              <p className="text-[10px] text-[var(--admin-muted)]">
                {row.environment} · {row.heartbeats} HB ·{" "}
                {formatRelative(row.lastSeen, locale)}
              </p>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function CronCenter({ cron }: { cron: MonitoringMissionData["cron"] }) {
  const { dict } = useDictionary();
  const t = dict.admin.monitoring;
  return (
    <Panel title={t.cronCenter} subtitle={t.cronCenterDesc}>
      <div className="space-y-2">
        {cron.map((job) => (
          <div
            key={job.name}
            className="rounded-xl border border-[var(--admin-border)] px-3 py-2 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-[var(--admin-text)]">{job.name}</p>
              <span className="font-mono text-[var(--admin-accent-text)]">
                {job.schedule}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-[var(--admin-muted)]">{job.path}</p>
            <p className="mt-1 text-[10px] text-[var(--admin-muted)]">
              {fillTemplate(t.cronJobMeta, {
                last: job.lastRun ?? "—",
                next: job.nextRun ?? "—",
                duration:
                  job.durationMs == null ? "—" : `${job.durationMs} ms`,
                failures:
                  job.failures == null ? "—" : String(job.failures),
              })}
            </p>
            <p className="mt-1 text-[10px] text-amber-200/70">
              {t.notes.cronHistory}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AlertCenter({ alerts }: { alerts: MonitoringMissionData["alerts"] }) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.monitoring;
  return (
    <Panel title={t.alertCenter} subtitle={t.alertCenterDesc}>
      <div className="max-h-72 space-y-1.5 overflow-y-auto">
        {alerts.length === 0 ? (
          <Empty>{t.noActiveAlerts}</Empty>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-amber-400/15 px-2.5 py-1.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[var(--admin-text)]">{alert.title}</p>
                <span className="uppercase text-amber-300">{alert.severity}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-[var(--admin-muted)]">
                {alert.source} ·{" "}
                {alert.acknowledged ? t.acknowledged : t.unacked} ·{" "}
                {alert.resolved ? t.alertResolved : t.alertOpen} ·{" "}
                {formatRelative(alert.occurredAt, locale)}
              </p>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-glass admin-panel rounded-2xl p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[var(--admin-muted)]">
        {label}
      </p>
      <p className="text-sm text-[var(--admin-text)]">{value}</p>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-xs text-[var(--admin-muted)]">{children}</p>;
}
