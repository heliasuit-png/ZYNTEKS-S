"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

const WorldMap = dynamic(
  () =>
    import("@/features/admin/components/monitoring/world-map").then(
      (mod) => mod.WorldMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="admin-skeleton h-72 w-full"
        aria-label="Loading world map"
      />
    ),
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
        eyebrow="Mission Control"
        title="Monitoring"
        description="Real-time platform telemetry, health, incidents, and operational probes."
        actions={
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wide text-[var(--admin-muted)]">
              Auto refresh
            </p>
            <p className="text-sm text-[var(--admin-accent-text)]">
              {secondsToRefresh}s · updated {formatRelative(data.generatedAt)}
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
          Honest gaps: {data.unavailable.join(" · ")}. Values shown are derived
          only from persisted telemetry.
        </p>
      ) : null}
    </div>
  );
}

function GlobalStatus({ data }: { data: MonitoringMissionData }) {
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
              Platform status
            </p>
            <p className={`text-xl font-semibold ${TONE_TEXT[tone]}`}>
              {data.globalStatus.platformLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-[var(--admin-muted)]">
          <Stat
            label="Response time"
            value={formatMs(data.globalStatus.responseTimeMs)}
          />
          <Stat
            label="Uptime (30d)"
            value={formatPercent(data.globalStatus.uptimePercent30d)}
          />
        </div>
      </div>
      <div className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9">
        {data.globalStatus.probes.map((probe) => (
          <article
            key={probe.id}
            className="rounded-xl border border-[var(--admin-border)] bg-black/20 px-2.5 py-2"
          >
            <div className="flex items-center gap-1.5">
              <HealthDot tone={probe.tone} />
              <p className="text-[11px] font-medium text-[var(--admin-text)]">
                {probe.label}
              </p>
            </div>
            <p className="mt-1 line-clamp-2 text-[10px] text-[var(--admin-muted)]">
              {probe.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LiveMetricsRow({
  metrics,
}: {
  metrics: MonitoringMissionData["liveMetrics"];
}) {
  const cards = [
    { label: "API req/sec", value: metrics.apiRequestsPerSec.toFixed(2) },
    { label: "Errors/min", value: metrics.errorsPerMin.toFixed(2) },
    { label: "Heartbeats/min", value: metrics.heartbeatsPerMin.toFixed(2) },
    { label: "AI req/min", value: metrics.aiRequestsPerMin.toFixed(2) },
    { label: "Avg response", value: formatMs(metrics.averageResponseTimeMs) },
    { label: "DB latency", value: formatMs(metrics.databaseLatencyMs) },
    {
      label: "Memory (SDK)",
      value:
        metrics.memoryMbAvg == null
          ? "—"
          : `${metrics.memoryMbAvg.toFixed(1)} MB`,
    },
    { label: "CPU", value: "Not available" },
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
  return (
    <Panel title="Live event stream" subtitle="Newest first · auto-refreshed">
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {stream.length === 0 ? (
          <AdminEmptyState title="No events in the selected range." />
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
                    {formatRelative(event.occurredAt)}
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
  const buckets = [
    { key: "healthy", label: "Healthy", tone: "text-emerald-300" },
    { key: "warning", label: "Warning", tone: "text-amber-300" },
    { key: "critical", label: "Critical", tone: "text-rose-300" },
    { key: "offline", label: "Offline", tone: "text-slate-300" },
  ] as const;

  return (
    <Panel title="Health overview" subtitle="Derived from heartbeats, errors, and incidents">
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
          <Empty>No projects in scope.</Empty>
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
                    ? ` · HB ${formatRelative(project.lastHeartbeatAt)}`
                    : " · no heartbeat"}
                </p>
              </div>
              <div className="text-right">
                <p className="capitalize text-[var(--admin-accent-text)]">
                  {project.status}
                </p>
                <p className="text-[10px] text-[var(--admin-muted)]">
                  {project.score == null ? "—" : `score ${project.score}`}
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
  return (
    <Panel title="Incident panel" subtitle="Open · monitoring · resolved">
      <IncidentGroup label="Open" items={incidents.open} />
      <IncidentGroup label="Monitoring" items={incidents.monitoring} />
      <IncidentGroup label="Resolved" items={incidents.resolved} />
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
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {label} ({items.length})
      </p>
      {items.length === 0 ? (
        <Empty>None</Empty>
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
  const max = Math.max(1, ...errors.trend.map((p) => p.value));
  return (
    <Panel title="Error analytics" subtitle="Top errors · newest · trend">
      <div className="mb-3 flex h-16 items-end gap-0.5" role="img" aria-label="Error trend">
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
        <ErrorList title="Top errors" items={errors.top} />
        <ErrorList title="Newest errors" items={errors.newest} />
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
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {title}
      </p>
      <div className="max-h-56 space-y-1.5 overflow-y-auto">
        {items.length === 0 ? (
          <Empty>No errors.</Empty>
        ) : (
          items.map((item) => (
            <div
              key={`${title}-${item.id}`}
              className="rounded-lg border border-rose-500/10 px-2.5 py-1.5 text-xs"
            >
              <p className="line-clamp-2 text-[var(--admin-text)]">{item.message}</p>
              <p className="mt-0.5 text-[10px] text-[var(--admin-muted)]">
                {item.level} · {item.occurrences}× · {item.projectName} ·{" "}
                {formatRelative(item.lastSeen)}
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
  return (
    <Panel title="Performance" subtitle="Endpoints · latency percentiles">
      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <Stat label="Avg" value={formatMs(metrics.averageResponseTimeMs)} />
        <Stat label="p95" value={formatMs(metrics.p95ResponseTimeMs)} />
        <Stat label="p99" value={formatMs(metrics.p99ResponseTimeMs)} />
      </div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        Largest endpoints
      </p>
      <EndpointTable rows={performance.endpoints} />
      <p className="mb-1.5 mt-3 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        Slowest requests (by p95)
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
  if (rows.length === 0) return <Empty>No performance samples.</Empty>;
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
  return (
    <Panel title="SDK overview" subtitle="Versions · environments · heartbeats">
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <Stat label="Production" value={formatNumber(sdk.productionHeartbeats)} />
        <Stat label="Development" value={formatNumber(sdk.developmentHeartbeats)} />
        <Stat label="Staging" value={formatNumber(sdk.stagingHeartbeats)} />
        <Stat label="Silent projects" value={formatNumber(sdk.silentProjects)} />
      </div>
      <div className="max-h-56 space-y-1.5 overflow-y-auto">
        {sdk.versions.length === 0 ? (
          <Empty>No SDK heartbeat versions in range.</Empty>
        ) : (
          sdk.versions.map((row) => (
            <div
              key={`${row.release}-${row.environment}`}
              className="rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-xs"
            >
              <p className="text-[var(--admin-text)]">{row.release}</p>
              <p className="text-[10px] text-[var(--admin-muted)]">
                {row.environment} · {row.heartbeats} HB ·{" "}
                {formatRelative(row.lastSeen)}
              </p>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function CronCenter({ cron }: { cron: MonitoringMissionData["cron"] }) {
  return (
    <Panel title="Cron center" subtitle="Registered jobs">
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
              Last run: {job.lastRun ?? "—"} · Next: {job.nextRun ?? "—"} ·
              Duration: {job.durationMs == null ? "—" : `${job.durationMs} ms`} ·
              Failures: {job.failures ?? "—"}
            </p>
            <p className="mt-1 text-[10px] text-amber-200/70">{job.note}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AlertCenter({ alerts }: { alerts: MonitoringMissionData["alerts"] }) {
  return (
    <Panel title="Alert center" subtitle="Current operational alerts">
      <div className="max-h-72 space-y-1.5 overflow-y-auto">
        {alerts.length === 0 ? (
          <Empty>No active alerts.</Empty>
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
                {alert.acknowledged ? "acknowledged" : "unacked"} ·{" "}
                {alert.resolved ? "resolved" : "open"} ·{" "}
                {formatRelative(alert.occurredAt)}
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
