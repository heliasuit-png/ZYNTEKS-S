"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Download,
  HeartPulse,
  Search,
  Timer,
} from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
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
  DASHBOARD_ROUTES,
} from "@/lib/constants";
import { formatDateTime, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import { HealthChart } from "@/features/health/components/health-chart";
import { ScoreGauge } from "@/features/health/components/score-gauge";
import {
  HEALTH_STATUS_TONE,
  HEALTH_STATUSES,
} from "@/features/health/lib/status";
import type {
  HealthDashboard,
  HealthTimelineEvent,
  ProjectHealthRow,
} from "@/features/health/types";
import type { HealthStatus } from "@/features/health/types";

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

function fill(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function HealthExplorer({
  data,
  projects,
  search,
  filters,
}: HealthExplorerProps) {
  const { dict, locale } = useDictionary();
  const t = dict.dash.health;
  const common = dict.dashboardCommon;
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

  const trendLabel =
    t.trends[data.trend.direction as keyof typeof t.trends] ??
    data.trend.direction;

  const columns: Column<ProjectHealthRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: t.colProject,
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
        header: t.colStatus,
        render: (row) => (
          <Badge tone={HEALTH_STATUS_TONE[row.status]}>
            {t.statuses[row.status as HealthStatus]}
          </Badge>
        ),
      },
      {
        key: "score",
        header: t.colScore,
        align: "right",
        render: (row) => (
          <span className="tabular-nums text-zt-text">{row.score}</span>
        ),
      },
      {
        key: "uptime",
        header: t.colUptime30d,
        align: "right",
        render: (row) => (
          <span className="tabular-nums text-zt-muted">
            {row.uptime.toFixed(2)}%
          </span>
        ),
      },
      {
        key: "latency",
        header: t.colLatency,
        align: "right",
        render: (row) => (
          <span className="tabular-nums text-zt-muted">
            {row.latencyMs ? `${row.latencyMs} ms` : "—"}
          </span>
        ),
      },
      {
        key: "heartbeat",
        header: t.colLastHeartbeat,
        align: "right",
        render: (row) => (
          <span className="text-zt-muted">
            {row.lastHeartbeatAt
              ? formatRelativeTime(row.lastHeartbeatAt, undefined, locale)
              : t.never}
          </span>
        ),
      },
    ],
    [t, updateParam],
  );

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title={t.createProjectFirst}
        description={t.createProjectFirstDesc}
        action={
          <Link
            href={DASHBOARD_ROUTES.projects}
            className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
          >
            {t.goToProjects}
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
              placeholder={t.searchPlaceholder}
              aria-label={t.searchAria}
              className="h-9 w-full rounded-xl border border-zt-border bg-zt-surface pl-9 pr-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={exportJson} label={t.copyJson} />
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
                {t.clearFilters}
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t.filterByProject}
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
            aria-label={t.filterByEnvironment}
            value={filters.environment}
            onChange={(e) => updateParam("environment", e.target.value)}
            className={selectClass}
          >
            <option value="">{t.allEnvironments}</option>
            {API_KEY_ENVIRONMENTS.map((env) => (
              <option key={env} value={env}>
                {common.environments[env]}
              </option>
            ))}
          </select>
          <select
            aria-label={t.filterByStatus}
            value={filters.status}
            onChange={(e) => updateParam("status", e.target.value)}
            className={selectClass}
          >
            <option value="">{t.allStatuses}</option>
            {HEALTH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t.statuses[status]}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-zt-muted">
            {t.from}
            <input
              type="date"
              value={filters.from}
              onChange={(e) => updateParam("from", e.target.value)}
              aria-label={t.from}
              className={selectClass}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-zt-muted">
            {t.to}
            <input
              type="date"
              value={filters.to}
              onChange={(e) => updateParam("to", e.target.value)}
              aria-label={t.to}
              className={selectClass}
            />
          </label>
        </div>
      </div>

      {!data.hasTelemetry ? (
        <EmptyState
          icon={HeartPulse}
          title={t.waitingTelemetry}
          description={t.waitingTelemetryDesc}
          action={
            <Link
              href={DASHBOARD_ROUTES.projects}
              className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
            >
              {t.openProjects}
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
                  label={t.overall}
                  value={data.score.overall}
                  size={132}
                />
                <div>
                  <p className="text-xs font-medium text-zt-muted">{t.status}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge tone={HEALTH_STATUS_TONE[data.status]}>
                      {t.statuses[data.status as HealthStatus]}
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
                      {trendLabel}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-zt-muted">{data.trend.label}</p>
                  <p className="mt-1 text-xs text-zt-muted">
                    {fill(t.previousWindowScore, {
                      score: data.trend.previousOverall,
                      delta: `${data.trend.changePct > 0 ? "+" : ""}${data.trend.changePct}`,
                    })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <ScoreGauge
                  label={t.reliability}
                  value={data.score.reliability}
                  delay={0.05}
                />
                <ScoreGauge
                  label={t.performance}
                  value={data.score.performance}
                  delay={0.1}
                />
                <ScoreGauge
                  label={t.availability}
                  value={data.score.availability}
                  delay={0.15}
                />
                <ScoreGauge
                  label={t.heartbeat}
                  value={data.score.heartbeat}
                  delay={0.2}
                />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-zt-border pt-4 sm:grid-cols-4">
              <Factor label={t.errorRate} value={data.score.errorRate} />
              <Factor label={t.latency} value={data.score.latency} />
              <Factor label={t.recovery} value={data.score.recovery} />
              <Factor label={t.overall} value={data.score.overall} />
            </div>
          </PanelContent>
        </Panel>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.05}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>{t.uptime}</PanelTitle>
            </PanelHeader>
            <PanelContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <UptimeChip label={t.uptime24h} value={data.uptime.h24} />
                <UptimeChip label={t.uptime7d} value={data.uptime.d7} />
                <UptimeChip label={t.uptime30d} value={data.uptime.d30} />
                <UptimeChip label={t.uptime90d} value={data.uptime.d90} />
                <UptimeChip label={t.uptimeCurrent} value={data.uptime.current} />
                <div className="rounded-xl border border-zt-border bg-zt-surface-2/50 px-3 py-3">
                  <p className="text-xs text-zt-muted">{t.trend}</p>
                  <p className="mt-1 text-sm font-medium capitalize text-zt-text">
                    {trendLabel}
                  </p>
                </div>
              </div>
            </PanelContent>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.08}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>{t.heartbeat}</PanelTitle>
            </PanelHeader>
            <PanelContent className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Metric
                  label={t.lastHeartbeat}
                  value={
                    data.heartbeat.lastAt
                      ? formatRelativeTime(data.heartbeat.lastAt, undefined, locale)
                      : t.never
                  }
                />
                <Metric
                  label={t.beatsInWindow}
                  value={String(data.heartbeat.count)}
                />
                <Metric
                  label={t.avgInterval}
                  value={
                    data.heartbeat.averageIntervalSec != null
                      ? `${data.heartbeat.averageIntervalSec}s`
                      : "—"
                  }
                />
                <Metric
                  label={t.expected}
                  value={`${data.heartbeat.expectedIntervalSec}s`}
                />
                <Metric
                  label={t.missingBeats}
                  value={String(data.heartbeat.missingCount)}
                />
                <Metric
                  label={t.consistency}
                  value={`${data.heartbeat.consistencyScore}`}
                />
              </dl>
              {data.heartbeat.stale ? (
                <p className="rounded-lg border border-zt-danger/30 bg-zt-danger/10 px-3 py-2 text-xs text-zt-danger">
                  {t.missingHeartbeatAlert}
                </p>
              ) : null}
              <div>
                <p className="mb-2 text-xs text-zt-muted">{t.intervalTimeline}</p>
                <HealthChart
                  values={data.heartbeat.intervals.slice(-40)}
                  tone={data.heartbeat.stale ? "danger" : "success"}
                  label={t.heartbeatIntervals}
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
              <PanelTitle>{t.latencyResponse}</PanelTitle>
            </PanelHeader>
            <PanelContent className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric label={t.average} value={fmtMs(data.latency.average)} />
                <Metric label={t.minimum} value={fmtMs(data.latency.min)} />
                <Metric label={t.maximum} value={fmtMs(data.latency.max)} />
                <Metric label={t.p95} value={fmtMs(data.latency.p95)} />
                <Metric label={t.p99} value={fmtMs(data.latency.p99)} />
                <Metric
                  label={t.samples}
                  value={String(data.latency.sampleCount)}
                />
              </dl>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs text-zt-muted">
                  <Timer className="size-3.5" aria-hidden />
                  {t.ttfbTimeline}
                </p>
                <HealthChart
                  values={data.latency.series}
                  tone="accent"
                  label={t.ttfb}
                />
              </div>
              <div>
                <p className="mb-2 text-xs text-zt-muted">
                  {t.responseTimePageLoad}
                </p>
                <HealthChart
                  values={data.latency.responseSeries}
                  tone="primary"
                  label={t.pageLoad}
                />
              </div>
            </PanelContent>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.12}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>{t.performance}</PanelTitle>
            </PanelHeader>
            <PanelContent>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric label={t.fcp} value={fmtMs(data.performance.fcp)} />
                <Metric label={t.lcp} value={fmtMs(data.performance.lcp)} />
                <Metric
                  label={t.cls}
                  value={
                    data.performance.cls != null
                      ? String(data.performance.cls)
                      : "—"
                  }
                />
                <Metric label={t.inp} value={fmtMs(data.performance.inp)} />
                <Metric label={t.ttfb} value={fmtMs(data.performance.ttfb)} />
                <Metric
                  label={t.pageLoad}
                  value={fmtMs(data.performance.pageLoad)}
                />
                <Metric
                  label={t.memoryUsed}
                  value={
                    data.performance.memoryUsedMb != null
                      ? `${data.performance.memoryUsedMb} MB`
                      : "—"
                  }
                />
                <Metric
                  label={t.memoryTotal}
                  value={
                    data.performance.memoryTotalMb != null
                      ? `${data.performance.memoryTotalMb} MB`
                      : "—"
                  }
                />
                <Metric
                  label={t.samples}
                  value={String(data.performance.sampleCount)}
                />
              </dl>
              {data.performance.navigation ? (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-zt-muted">{t.navigationTiming}</p>
                    <CopyButton
                      value={JSON.stringify(data.performance.navigation, null, 2)}
                      label={common.copy}
                    />
                  </div>
                  <pre className="max-h-40 overflow-auto rounded-xl border border-zt-border bg-black/30 p-3 font-mono text-[11px] text-zt-muted">
                    {JSON.stringify(data.performance.navigation, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zt-muted">
                  {t.noNavigationTiming}
                </p>
              )}
            </PanelContent>
          </Panel>
        </FadeIn>
      </div>

      <FadeIn delay={0.14}>
        <Panel>
          <PanelHeader>
            <PanelTitle>{t.healthTimeline}</PanelTitle>
          </PanelHeader>
          <PanelContent>
            {data.timeline.length === 0 ? (
              <p className="text-sm text-zt-muted">{t.timelineEmpty}</p>
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
            <PanelTitle>{t.monitoredProjects}</PanelTitle>
          </PanelHeader>
          <PanelContent>
            {data.projects.length === 0 ? (
              <EmptyState
                icon={Activity}
                title={t.noMatching}
                description={t.noMatchingDesc}
                action={
                  hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white"
                    >
                      {t.clearFilters}
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
