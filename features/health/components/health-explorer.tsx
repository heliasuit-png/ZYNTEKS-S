"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Download,
  HeartPulse,
  Search,
  Timer,
} from "lucide-react";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { Badge } from "@/components/dashboard/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FadeIn } from "@/components/dashboard/motion";
import { DataTable } from "@/components/dashboard/data-table";
import type { Column } from "@/components/dashboard/data-table";
import { CopyButton } from "@/components/dashboard/copy-button";
import {
  API_KEY_ENVIRONMENTS,
  API_KEY_ENVIRONMENT_LABELS,
  DASHBOARD_ROUTES,
} from "@/lib/constants";
import { formatDateTime, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import { HealthChart } from "@/features/health/components/health-chart";
import { ScoreGauge } from "@/features/health/components/score-gauge";
import {
  HEALTH_STATUS_LABELS,
  HEALTH_STATUS_TONE,
  HEALTH_STATUSES,
} from "@/features/health/lib/status";
import type {
  HealthDashboard,
  HealthTimelineEvent,
  ProjectHealthRow,
} from "@/features/health/types";

const selectClass =
  "h-9 rounded-xl border border-zt-border bg-zt-surface px-3 text-sm text-zt-text focus:outline-none focus:ring-2 focus:ring-zt-primary/40";

interface ProjectOption {
  id: string;
  name: string;
}

interface HealthFilters {
  projectId: string;
  environment: string;
  status: string;
  from: string;
  to: string;
}

interface HealthExplorerProps {
  data: HealthDashboard;
  projects: ProjectOption[];
  search: string;
  filters: HealthFilters;
}

const timelineTone: Record<HealthTimelineEvent["tone"], string> = {
  danger: "bg-zt-danger",
  warning: "bg-zt-warning",
  primary: "bg-zt-primary",
  success: "bg-zt-success",
  default: "bg-zt-muted",
};

export function HealthExplorer({
  data,
  projects,
  search,
  filters,
}: HealthExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      if (searchValue === search) return;
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue.trim()) params.set("q", searchValue.trim());
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [searchValue, search, pathname, router, searchParams]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  function clearFilters() {
    router.replace(pathname);
  }

  async function download(format: "csv" | "json") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("format", format);
    const response = await fetch(
      `/api/health-monitor/export?${params.toString()}`,
    );
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zynteksis-health.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasActiveFilters = Boolean(
    search ||
      filters.projectId ||
      filters.environment ||
      filters.status ||
      filters.from ||
      filters.to,
  );

  const exportJson = JSON.stringify(
    {
      score: data.score,
      status: data.status,
      uptime: data.uptime,
      latency: data.latency,
      performance: data.performance,
      heartbeat: {
        lastAt: data.heartbeat.lastAt,
        count: data.heartbeat.count,
        averageIntervalSec: data.heartbeat.averageIntervalSec,
        missingCount: data.heartbeat.missingCount,
        consistencyScore: data.heartbeat.consistencyScore,
        stale: data.heartbeat.stale,
      },
      projects: data.projects,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  );

  const columns: Column<ProjectHealthRow>[] = [
    {
      key: "name",
      header: "Project",
      render: (row) => (
        <button
          type="button"
          onClick={() => updateParam("projectId", row.id)}
          className="text-left font-medium text-zt-text transition-colors hover:text-zt-primary"
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={HEALTH_STATUS_TONE[row.status]}>
          {HEALTH_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: "score",
      header: "Score",
      align: "right",
      render: (row) => (
        <span className="tabular-nums text-zt-text">{row.score}</span>
      ),
    },
    {
      key: "uptime",
      header: "Uptime 30d",
      align: "right",
      render: (row) => (
        <span className="tabular-nums text-zt-muted">
          {row.uptime.toFixed(2)}%
        </span>
      ),
    },
    {
      key: "latency",
      header: "Latency",
      align: "right",
      render: (row) => (
        <span className="tabular-nums text-zt-muted">
          {row.latencyMs ? `${row.latencyMs} ms` : "—"}
        </span>
      ),
    },
    {
      key: "heartbeat",
      header: "Last heartbeat",
      align: "right",
      render: (row) => (
        <span className="text-zt-muted">
          {row.lastHeartbeatAt
            ? formatRelativeTime(row.lastHeartbeatAt)
            : "Never"}
        </span>
      ),
    },
  ];

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Create a project first"
        description="Health monitoring tracks heartbeats and performance from the SDK."
        action={
          <Link
            href={DASHBOARD_ROUTES.projects}
            className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
          >
            Go to Projects
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zt-muted"
              aria-hidden
            />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search project, status, incident…"
              aria-label="Search health"
              className="h-9 w-full rounded-xl border border-zt-border bg-zt-surface pl-9 pr-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={exportJson} label="Copy JSON" />
            <button
              type="button"
              onClick={() => download("json")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zt-border bg-zt-surface-2 px-2.5 py-1.5 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
            >
              <Download className="size-3.5" aria-hidden />
              JSON
            </button>
            <button
              type="button"
              onClick={() => download("csv")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zt-border bg-zt-surface-2 px-2.5 py-1.5 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
            >
              <Download className="size-3.5" aria-hidden />
              CSV
            </button>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-zt-primary hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by project"
            value={filters.projectId || data.selectedProjectId || ""}
            onChange={(e) => updateParam("projectId", e.target.value)}
            className={selectClass}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by environment"
            value={filters.environment}
            onChange={(e) => updateParam("environment", e.target.value)}
            className={selectClass}
          >
            <option value="">All environments</option>
            {API_KEY_ENVIRONMENTS.map((env) => (
              <option key={env} value={env}>
                {API_KEY_ENVIRONMENT_LABELS[env]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) => updateParam("status", e.target.value)}
            className={selectClass}
          >
            <option value="">All statuses</option>
            {HEALTH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {HEALTH_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-zt-muted">
            From
            <input
              type="date"
              value={filters.from}
              onChange={(e) => updateParam("from", e.target.value)}
              aria-label="From date"
              className={selectClass}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-zt-muted">
            To
            <input
              type="date"
              value={filters.to}
              onChange={(e) => updateParam("to", e.target.value)}
              aria-label="To date"
              className={selectClass}
            />
          </label>
        </div>
      </div>

      {!data.hasTelemetry ? (
        <EmptyState
          icon={HeartPulse}
          title="Waiting for telemetry"
          description="Install the SDK to start receiving heartbeats and performance metrics. Scores stay neutral until data arrives."
          action={
            <Link
              href={DASHBOARD_ROUTES.projects}
              className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
            >
              Open Projects
            </Link>
          }
        />
      ) : null}

      <FadeIn>
        <Panel>
          <PanelContent>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-6">
                <ScoreGauge
                  label="Overall"
                  value={data.score.overall}
                  size={132}
                />
                <div>
                  <p className="text-xs font-medium text-zt-muted">Status</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge tone={HEALTH_STATUS_TONE[data.status]}>
                      {HEALTH_STATUS_LABELS[data.status]}
                    </Badge>
                    <Badge
                      tone={
                        data.trend.direction === "improving"
                          ? "success"
                          : data.trend.direction === "degrading"
                            ? "danger"
                            : "default"
                      }
                    >
                      {data.trend.direction}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-zt-muted">{data.trend.label}</p>
                  <p className="mt-1 text-xs text-zt-muted">
                    Previous window score {data.trend.previousOverall} · error
                    rate Δ {data.trend.changePct > 0 ? "+" : ""}
                    {data.trend.changePct}%
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <ScoreGauge label="Reliability" value={data.score.reliability} delay={0.05} />
                <ScoreGauge label="Performance" value={data.score.performance} delay={0.1} />
                <ScoreGauge label="Availability" value={data.score.availability} delay={0.15} />
                <ScoreGauge label="Heartbeat" value={data.score.heartbeat} delay={0.2} />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-zt-border pt-4 sm:grid-cols-4">
              <Factor label="Error rate" value={data.score.errorRate} />
              <Factor label="Latency" value={data.score.latency} />
              <Factor label="Recovery" value={data.score.recovery} />
              <Factor label="Overall" value={data.score.overall} />
            </div>
          </PanelContent>
        </Panel>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.05}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>Uptime</PanelTitle>
            </PanelHeader>
            <PanelContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <UptimeChip label="24 Hours" value={data.uptime.h24} />
                <UptimeChip label="7 Days" value={data.uptime.d7} />
                <UptimeChip label="30 Days" value={data.uptime.d30} />
                <UptimeChip label="90 Days" value={data.uptime.d90} />
                <UptimeChip label="Current" value={data.uptime.current} />
                <div className="rounded-xl border border-zt-border bg-zt-surface-2/50 px-3 py-3">
                  <p className="text-xs text-zt-muted">Trend</p>
                  <p className="mt-1 text-sm font-medium capitalize text-zt-text">
                    {data.trend.direction}
                  </p>
                </div>
              </div>
            </PanelContent>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.08}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>Heartbeat</PanelTitle>
            </PanelHeader>
            <PanelContent className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Metric
                  label="Last heartbeat"
                  value={
                    data.heartbeat.lastAt
                      ? formatRelativeTime(data.heartbeat.lastAt)
                      : "Never"
                  }
                />
                <Metric
                  label="Beats in window"
                  value={String(data.heartbeat.count)}
                />
                <Metric
                  label="Avg interval"
                  value={
                    data.heartbeat.averageIntervalSec != null
                      ? `${data.heartbeat.averageIntervalSec}s`
                      : "—"
                  }
                />
                <Metric
                  label="Expected"
                  value={`${data.heartbeat.expectedIntervalSec}s`}
                />
                <Metric
                  label="Missing beats"
                  value={String(data.heartbeat.missingCount)}
                />
                <Metric
                  label="Consistency"
                  value={`${data.heartbeat.consistencyScore}`}
                />
              </dl>
              {data.heartbeat.stale ? (
                <p className="rounded-lg border border-zt-danger/30 bg-zt-danger/10 px-3 py-2 text-xs text-zt-danger">
                  Missing heartbeat detected — last beat exceeds the outage
                  threshold.
                </p>
              ) : null}
              <div>
                <p className="mb-2 text-xs text-zt-muted">Interval timeline</p>
                <HealthChart
                  values={data.heartbeat.intervals.slice(-40)}
                  tone={data.heartbeat.stale ? "danger" : "success"}
                  label="Heartbeat intervals"
                />
              </div>
            </PanelContent>
          </Panel>
        </FadeIn>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.1}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>Latency & response time</PanelTitle>
            </PanelHeader>
            <PanelContent className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric
                  label="Average"
                  value={fmtMs(data.latency.average)}
                />
                <Metric label="Minimum" value={fmtMs(data.latency.min)} />
                <Metric label="Maximum" value={fmtMs(data.latency.max)} />
                <Metric label="P95" value={fmtMs(data.latency.p95)} />
                <Metric label="P99" value={fmtMs(data.latency.p99)} />
                <Metric
                  label="Samples"
                  value={String(data.latency.sampleCount)}
                />
              </dl>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs text-zt-muted">
                  <Timer className="size-3.5" aria-hidden />
                  TTFB timeline
                </p>
                <HealthChart
                  values={data.latency.series}
                  tone="accent"
                  label="TTFB"
                />
              </div>
              <div>
                <p className="mb-2 text-xs text-zt-muted">Response time (page load)</p>
                <HealthChart
                  values={data.latency.responseSeries}
                  tone="primary"
                  label="Page load"
                />
              </div>
            </PanelContent>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.12}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>Performance</PanelTitle>
            </PanelHeader>
            <PanelContent>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric label="FCP" value={fmtMs(data.performance.fcp)} />
                <Metric label="LCP" value={fmtMs(data.performance.lcp)} />
                <Metric
                  label="CLS"
                  value={
                    data.performance.cls != null
                      ? String(data.performance.cls)
                      : "—"
                  }
                />
                <Metric label="INP" value={fmtMs(data.performance.inp)} />
                <Metric label="TTFB" value={fmtMs(data.performance.ttfb)} />
                <Metric
                  label="Page load"
                  value={fmtMs(data.performance.pageLoad)}
                />
                <Metric
                  label="Memory used"
                  value={
                    data.performance.memoryUsedMb != null
                      ? `${data.performance.memoryUsedMb} MB`
                      : "—"
                  }
                />
                <Metric
                  label="Memory total"
                  value={
                    data.performance.memoryTotalMb != null
                      ? `${data.performance.memoryTotalMb} MB`
                      : "—"
                  }
                />
                <Metric
                  label="Samples"
                  value={String(data.performance.sampleCount)}
                />
              </dl>
              {data.performance.navigation ? (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-zt-muted">Navigation timing</p>
                    <CopyButton
                      value={JSON.stringify(data.performance.navigation, null, 2)}
                      label="Copy"
                    />
                  </div>
                  <pre className="max-h-40 overflow-auto rounded-xl border border-zt-border bg-black/30 p-3 font-mono text-[11px] text-zt-muted">
                    {JSON.stringify(data.performance.navigation, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zt-muted">
                  No navigation timing reported yet.
                </p>
              )}
            </PanelContent>
          </Panel>
        </FadeIn>
      </div>

      <FadeIn delay={0.14}>
        <Panel>
          <PanelHeader>
            <PanelTitle>Health Timeline</PanelTitle>
          </PanelHeader>
          <PanelContent>
            {data.timeline.length === 0 ? (
              <p className="text-sm text-zt-muted">
                Timeline events appear as heartbeats, errors, incidents, and
                deployments are recorded.
              </p>
            ) : (
              <ol className="relative max-h-96 space-y-4 overflow-y-auto border-l border-zt-border pl-5">
                {data.timeline.map((event) => (
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

      <FadeIn delay={0.16}>
        <Panel>
          <PanelHeader>
            <PanelTitle>Monitored projects</PanelTitle>
          </PanelHeader>
          <PanelContent>
            {data.projects.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No matching projects"
                description="Try adjusting search or filters."
                action={
                  hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white"
                    >
                      Clear filters
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <DataTable
                columns={columns}
                rows={data.projects}
                getRowId={(row) => row.id}
              />
            )}
          </PanelContent>
        </Panel>
      </FadeIn>
    </div>
  );
}

function Factor({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-zt-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-zt-text">
        {value}
      </p>
    </div>
  );
}

function UptimeChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zt-border bg-zt-surface-2/50 px-3 py-3">
      <p className="text-xs text-zt-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-zt-text">
        {value.toFixed(2)}%
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zt-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium tabular-nums text-zt-text">
        {value}
      </dd>
    </div>
  );
}

function fmtMs(value: number | null): string {
  if (value == null) return "—";
  return `${Math.round(value)} ms`;
}
