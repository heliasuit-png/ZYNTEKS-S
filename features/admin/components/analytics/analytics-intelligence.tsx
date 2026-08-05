"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import type { AnalyticsIntelligenceData } from "@/services/admin/analytics-intelligence.types";
import {
  formatMs,
  formatNumber,
  formatRelative,
} from "@/features/admin/components/executive/format";
import { AnalyticsFilters } from "@/features/admin/components/analytics/analytics-filters";
import {
  BarTrend,
  MultiSeriesChart,
} from "@/features/admin/components/analytics/analytics-charts";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-header";
import { ADMIN_KPI_STAGGER } from "@/features/admin/components/ui/admin-motion";

const AnalyticsMap = dynamic(
  () =>
    import("@/features/admin/components/analytics/analytics-map").then(
      (mod) => mod.AnalyticsMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="admin-skeleton h-72 w-full"
        aria-label="Loading geography map"
      />
    ),
  },
);

function pct(value: number | null): string {
  if (value == null) return "—";
  return `${value}%`;
}

export function AnalyticsIntelligence({
  data,
}: {
  data: AnalyticsIntelligenceData;
}) {
  const kpis = [
    { label: "DAU", value: formatNumber(data.executive.dau), hint: "Distinct sessions 24h" },
    { label: "WAU", value: formatNumber(data.executive.wau), hint: "Distinct sessions 7d" },
    { label: "MAU", value: formatNumber(data.executive.mau), hint: "Distinct sessions 30d" },
    { label: "New users", value: formatNumber(data.executive.newUsers), hint: "profiles.created_at" },
    {
      label: "Retention",
      value: pct(data.executive.retentionProxyPercent),
      hint: "Prior actives returning (proxy)",
    },
    {
      label: "Churn",
      value: pct(data.executive.churnProxyPercent),
      hint: "Prior actives inactive (proxy)",
    },
    {
      label: "Workspace growth",
      value: formatNumber(data.executive.workspaceGrowth),
      hint: "Created in range",
    },
    {
      label: "Project growth",
      value: formatNumber(data.executive.projectGrowth),
      hint: "Created in range",
    },
    {
      label: "API growth",
      value: formatNumber(data.executive.apiGrowth),
      hint: "Keys created in range",
    },
    {
      label: "AI usage",
      value: formatNumber(data.executive.aiRequests),
      hint: `${formatNumber(data.executive.aiTokens)} tokens`,
    },
    {
      label: "SDK adoption",
      value: pct(data.executive.sdkAdoptionPercent),
      hint: "Projects with heartbeats",
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Intelligence plane"
        title="Analytics Intelligence Center"
        description={`Platform growth, engagement, API, AI, SDK, and performance analytics — real telemetry only. Updated ${formatRelative(data.generatedAt)}.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 2xl:grid-cols-11">
        {kpis.map((card, index) => (
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
            <p className="mt-0.5 text-[10px] text-[var(--admin-accent-text)]">
              {card.hint}
            </p>
          </motion.article>
        ))}
      </div>

      <AnalyticsFilters options={data.filterOptions} />

      <Panel title="Growth & engagement trend" subtitle="Daily series across core signals">
        <MultiSeriesChart data={data.series} title="Analytics trend" />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <UserAnalytics users={data.users} />
        <WorkspaceAnalytics workspaces={data.workspaces} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ApiAnalytics api={data.api} />
        <AiAnalytics ai={data.ai} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SdkAnalytics sdk={data.sdk} />
        <ErrorAnalytics errors={data.errors} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PerformanceAnalytics performance={data.performance} />
        <AnalyticsMap geography={data.geography} />
      </div>

      <p className="text-[11px] text-[var(--admin-muted)]">
        Honest gaps: {data.unavailable.join(" · ")}. Retention/churn are activity
        proxies, not subscription churn. API latency uses client RUM samples.
      </p>
    </div>
  );
}

function UserAnalytics({
  users,
}: {
  users: AnalyticsIntelligenceData["users"];
}) {
  return (
    <Panel title="User analytics" subtitle="Countries · browsers · OS · languages · devices">
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <MiniStat label="New sessions" value={formatNumber(users.newSessions)} />
        <MiniStat
          label="Returning sessions"
          value={formatNumber(users.returningSessions)}
        />
        <MiniStat
          label="Session duration"
          value={
            users.averageSessionDurationMs == null
              ? "—"
              : formatMs(users.averageSessionDurationMs)
          }
        />
      </div>
      <p className="mb-3 text-[10px] text-[var(--admin-muted)]">
        {users.sessionDurationNote}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <NamedList title="Countries" rows={users.countries} />
        <NamedList title="Browsers" rows={users.browsers} />
        <NamedList title="Operating systems" rows={users.operatingSystems} />
        <NamedList title="Languages" rows={users.languages} />
        <NamedList title="Devices" rows={users.devices} />
      </div>
    </Panel>
  );
}

function WorkspaceAnalytics({
  workspaces,
}: {
  workspaces: AnalyticsIntelligenceData["workspaces"];
}) {
  return (
    <Panel title="Workspace analytics" subtitle="Growth · plans · health">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Growth" value={formatNumber(workspaces.growth)} />
        <MiniStat label="Projects" value={formatNumber(workspaces.totalProjects)} />
        <MiniStat label="Members" value={formatNumber(workspaces.totalMembers)} />
        <MiniStat
          label="Avg health"
          value={
            workspaces.averageHealthScore == null
              ? "—"
              : String(workspaces.averageHealthScore)
          }
        />
      </div>
      <NamedList title="Plans" rows={workspaces.byPlan} />
      <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
        {workspaces.rows.map((row) => (
          <div
            key={row.id}
            className="rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-[11px] text-[var(--admin-muted)]"
          >
            <span className="text-[var(--admin-text)]">{row.name}</span> ·{" "}
            {row.plan} · {row.projects} projects · {row.members} members ·{" "}
            {row.apiEvents} API · health {row.healthScore ?? "—"}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ApiAnalytics({
  api,
}: {
  api: AnalyticsIntelligenceData["api"];
}) {
  return (
    <Panel
      title="API analytics"
      subtitle="Key events + client RUM latency (not server APM)"
    >
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Requests" value={formatNumber(api.requests)} />
        <MiniStat label="Success rate" value={pct(api.successRate)} />
        <MiniStat label="Error rate" value={pct(api.errorRate)} />
        <MiniStat label="Avg latency" value={formatMs(api.averageLatencyMs)} />
      </div>
      <BarTrend points={api.trafficTrend} color="#fbbf24" label="API traffic" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <NamedList title="Environment split" rows={api.byEnvironment} />
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            Top endpoints
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {api.topEndpoints.length === 0 ? (
              <Empty>No RUM samples.</Empty>
            ) : (
              api.topEndpoints.map((row) => (
                <div
                  key={row.url}
                  className="rounded-lg border border-[var(--admin-border)] px-2 py-1 text-[11px] text-[var(--admin-muted)]"
                >
                  <span className="text-[var(--admin-text)]">{row.url}</span> · n=
                  {row.samples} · p95 {formatMs(row.p95Ms)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function AiAnalytics({ ai }: { ai: AnalyticsIntelligenceData["ai"] }) {
  return (
    <Panel title="AI analytics" subtitle="Requests · models · tokens">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Requests" value={formatNumber(ai.requests)} />
        <MiniStat label="Tokens" value={formatNumber(ai.tokens)} />
        <MiniStat label="Latency" value="—" />
        <MiniStat label="Success rate" value={pct(ai.successRate)} />
      </div>
      <p className="mb-2 text-[10px] text-[var(--admin-muted)]">
        AI latency and failure outcomes are not persisted on `ai_usage`.
      </p>
      <BarTrend
        points={ai.dailyTrend.map((p) => ({ label: p.label, value: p.requests }))}
        color="#60a5fa"
        label="AI daily requests"
      />
      <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
        {ai.byModel.map((row) => (
          <div
            key={row.model}
            className="rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
          >
            <span className="text-[var(--admin-text)]">{row.model}</span> ·{" "}
            {row.requests} req · {formatNumber(row.tokens)} tokens
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SdkAnalytics({ sdk }: { sdk: AnalyticsIntelligenceData["sdk"] }) {
  return (
    <Panel title="SDK analytics" subtitle="Versions · installs · heartbeats">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Installations" value={formatNumber(sdk.installations)} />
        <MiniStat label="Heartbeats" value={formatNumber(sdk.heartbeats)} />
        <MiniStat label="Errors" value={formatNumber(sdk.errors)} />
        <MiniStat
          label="Perf samples"
          value={formatNumber(sdk.performanceSamples)}
        />
      </div>
      <NamedList title="Environments" rows={sdk.byEnvironment} />
      <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
        {sdk.versions.map((row) => (
          <div
            key={`${row.release}-${row.environment}`}
            className="rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
          >
            <span className="text-[var(--admin-text)]">{row.release}</span> ·{" "}
            {row.environment} · {row.heartbeats} HB · {row.errors} errors ·{" "}
            {formatRelative(row.lastSeen)}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ErrorAnalytics({
  errors,
}: {
  errors: AnalyticsIntelligenceData["errors"];
}) {
  return (
    <Panel title="Error analytics" subtitle="Top errors · trend · resolution">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Frequency" value={formatNumber(errors.frequency)} />
        <MiniStat
          label="Avg resolution"
          value={
            errors.averageResolutionSeconds == null
              ? "—"
              : `${Math.round(errors.averageResolutionSeconds / 60)}m`
          }
        />
        <MiniStat
          label="Projects"
          value={formatNumber(errors.affectedProjects)}
        />
        <MiniStat
          label="Workspaces"
          value={formatNumber(errors.affectedWorkspaces)}
        />
      </div>
      <p className="mb-2 text-[10px] text-[var(--admin-muted)]">
        Resolution time uses incident detected→resolved intervals (errors have no
        resolved_at).
      </p>
      <BarTrend points={errors.trend} color="#f87171" label="Error trend" />
      <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
        {errors.top.map((row) => (
          <div
            key={row.id}
            className="rounded-lg border border-rose-500/15 px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
          >
            <p className="line-clamp-2 text-[var(--admin-text)]">{row.message}</p>
            {row.occurrences}× · {row.projectName} · {row.workspaceName} ·{" "}
            {formatRelative(row.lastSeen)}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PerformanceAnalytics({
  performance,
}: {
  performance: AnalyticsIntelligenceData["performance"];
}) {
  return (
    <Panel title="Performance analytics" subtitle="RUM response percentiles">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Avg" value={formatMs(performance.averageMs)} />
        <MiniStat label="P50" value={formatMs(performance.p50Ms)} />
        <MiniStat label="P95" value={formatMs(performance.p95Ms)} />
        <MiniStat label="P99" value={formatMs(performance.p99Ms)} />
      </div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        Slow endpoints
      </p>
      <div className="max-h-56 space-y-1 overflow-y-auto">
        {performance.slowEndpoints.length === 0 ? (
          <Empty>No performance samples.</Empty>
        ) : (
          performance.slowEndpoints.map((row) => (
            <div
              key={row.url}
              className="rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
            >
              <span className="text-[var(--admin-text)]">{row.url}</span> · n=
              {row.samples} · p95 {formatMs(row.p95Ms)}
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-2">
      <p className="text-[10px] uppercase text-[var(--admin-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--admin-text)]">{value}</p>
    </div>
  );
}

function NamedList({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number }[];
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {title}
      </p>
      <div className="max-h-36 space-y-1 overflow-y-auto">
        {rows.length === 0 ? (
          <Empty>No data.</Empty>
        ) : (
          rows.slice(0, 8).map((row) => (
            <div
              key={`${title}-${row.label}`}
              className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] px-2 py-1 text-[11px]"
            >
              <span className="truncate text-[var(--admin-text)]">{row.label}</span>
              <span className="text-[var(--admin-accent-text)]">
                {row.value.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-xs text-[var(--admin-muted)]">{children}</p>;
}
