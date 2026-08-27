"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { fillTemplate } from "@/lib/i18n/fill-template";
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

function AnalyticsMapLoading() {
  const { dict } = useDictionary();
  return (
    <div
      className="admin-skeleton h-72 w-full"
      aria-label={dict.admin.analytics.loadingMap}
    />
  );
}

const AnalyticsMap = dynamic(
  () =>
    import("@/features/admin/components/analytics/analytics-map").then(
      (mod) => mod.AnalyticsMap,
    ),
  {
    ssr: false,
    loading: () => <AnalyticsMapLoading />,
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
  const { dict, locale } = useDictionary();
  const t = dict.admin.analytics;
  const kpis = [
    { label: t.dau, value: formatNumber(data.executive.dau), hint: t.hints.dau },
    { label: t.wau, value: formatNumber(data.executive.wau), hint: t.hints.wau },
    { label: t.mau, value: formatNumber(data.executive.mau), hint: t.hints.mau },
    {
      label: t.newUsers,
      value: formatNumber(data.executive.newUsers),
      hint: t.hints.newUsers,
    },
    {
      label: t.retention,
      value: pct(data.executive.retentionProxyPercent),
      hint: t.hints.retention,
    },
    {
      label: t.churn,
      value: pct(data.executive.churnProxyPercent),
      hint: t.hints.churn,
    },
    {
      label: t.workspaceGrowth,
      value: formatNumber(data.executive.workspaceGrowth),
      hint: t.hints.workspaceGrowth,
    },
    {
      label: t.projectGrowth,
      value: formatNumber(data.executive.projectGrowth),
      hint: t.hints.projectGrowth,
    },
    {
      label: t.apiGrowth,
      value: formatNumber(data.executive.apiGrowth),
      hint: t.hints.apiGrowth,
    },
    {
      label: t.aiUsage,
      value: formatNumber(data.executive.aiRequests),
      hint: fillTemplate(t.tokensCount, {
        count: formatNumber(data.executive.aiTokens),
      }),
    },
    {
      label: t.sdkAdoption,
      value: pct(data.executive.sdkAdoptionPercent),
      hint: t.hints.sdkAdoption,
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow={t.eyebrow}
        title={t.pageTitle}
        description={fillTemplate(t.description, {
          when: formatRelative(data.generatedAt, locale),
        })}
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

      <Panel title={t.panels.growthTrend} subtitle={t.panelsDesc.growthTrend}>
        <MultiSeriesChart data={data.series} title={t.trendAria} />
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
        {fillTemplate(t.honestGaps, {
          items: data.unavailable.join(" · "),
        })}
      </p>
    </div>
  );
}

function UserAnalytics({
  users,
}: {
  users: AnalyticsIntelligenceData["users"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.analytics;
  return (
    <Panel title={t.panels.userAnalytics} subtitle={t.panelsDesc.userAnalytics}>
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <MiniStat
          label={t.stats.newSessions}
          value={formatNumber(users.newSessions)}
        />
        <MiniStat
          label={t.stats.returningSessions}
          value={formatNumber(users.returningSessions)}
        />
        <MiniStat
          label={t.stats.sessionDuration}
          value={
            users.averageSessionDurationMs == null
              ? "—"
              : formatMs(users.averageSessionDurationMs)
          }
        />
      </div>
      <p className="mb-3 text-[10px] text-[var(--admin-muted)]">
        {t.notes.sessionDuration}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <NamedList title={t.stats.countries} rows={users.countries} />
        <NamedList title={t.stats.browsers} rows={users.browsers} />
        <NamedList
          title={t.stats.operatingSystems}
          rows={users.operatingSystems}
        />
        <NamedList title={t.stats.languages} rows={users.languages} />
        <NamedList title={t.stats.devices} rows={users.devices} />
      </div>
    </Panel>
  );
}

function WorkspaceAnalytics({
  workspaces,
}: {
  workspaces: AnalyticsIntelligenceData["workspaces"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.analytics;
  return (
    <Panel
      title={t.panels.workspaceAnalytics}
      subtitle={t.panelsDesc.workspaceAnalytics}
    >
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat
          label={t.stats.growth}
          value={formatNumber(workspaces.growth)}
        />
        <MiniStat
          label={t.stats.projects}
          value={formatNumber(workspaces.totalProjects)}
        />
        <MiniStat
          label={t.stats.members}
          value={formatNumber(workspaces.totalMembers)}
        />
        <MiniStat
          label={t.stats.avgHealth}
          value={
            workspaces.averageHealthScore == null
              ? "—"
              : String(workspaces.averageHealthScore)
          }
        />
      </div>
      <NamedList title={t.stats.plans} rows={workspaces.byPlan} />
      <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
        {workspaces.rows.map((row) => (
          <div
            key={row.id}
            className="rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-[11px] text-[var(--admin-muted)]"
          >
            <span className="text-[var(--admin-text)]">{row.name}</span> ·{" "}
            {fillTemplate(t.workspaceRowMeta, {
              plan: row.plan,
              projects: String(row.projects),
              members: String(row.members),
              apiEvents: String(row.apiEvents),
              health: row.healthScore == null ? "—" : String(row.healthScore),
            })}
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
  const { dict } = useDictionary();
  const t = dict.admin.analytics;
  return (
    <Panel title={t.panels.apiAnalytics} subtitle={t.panelsDesc.apiAnalytics}>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label={t.stats.requests} value={formatNumber(api.requests)} />
        <MiniStat label={t.stats.successRate} value={pct(api.successRate)} />
        <MiniStat label={t.stats.errorRate} value={pct(api.errorRate)} />
        <MiniStat
          label={t.stats.avgLatency}
          value={formatMs(api.averageLatencyMs)}
        />
      </div>
      <BarTrend
        points={api.trafficTrend}
        color="#fbbf24"
        label={t.stats.apiTraffic}
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <NamedList title={t.stats.environmentSplit} rows={api.byEnvironment} />
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            {t.topEndpoints}
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {api.topEndpoints.length === 0 ? (
              <Empty>{t.noRumSamples}</Empty>
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
  const { dict } = useDictionary();
  const t = dict.admin.analytics;
  return (
    <Panel title={t.panels.aiAnalytics} subtitle={t.panelsDesc.aiAnalytics}>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label={t.stats.requests} value={formatNumber(ai.requests)} />
        <MiniStat label={t.stats.tokens} value={formatNumber(ai.tokens)} />
        <MiniStat label={t.stats.latency} value="—" />
        <MiniStat label={t.stats.successRate} value={pct(ai.successRate)} />
      </div>
      <p className="mb-2 text-[10px] text-[var(--admin-muted)]">
        {t.aiLatencyFootnote}
      </p>
      <BarTrend
        points={ai.dailyTrend.map((p) => ({
          label: p.label,
          value: p.requests,
        }))}
        color="#60a5fa"
        label={t.stats.aiDailyRequests}
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
  const { dict, locale } = useDictionary();
  const t = dict.admin.analytics;
  return (
    <Panel title={t.panels.sdkAnalytics} subtitle={t.panelsDesc.sdkAnalytics}>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat
          label={t.stats.installations}
          value={formatNumber(sdk.installations)}
        />
        <MiniStat
          label={t.stats.heartbeats}
          value={formatNumber(sdk.heartbeats)}
        />
        <MiniStat label={t.stats.errors} value={formatNumber(sdk.errors)} />
        <MiniStat
          label={t.stats.perfSamples}
          value={formatNumber(sdk.performanceSamples)}
        />
      </div>
      <NamedList title={t.stats.environments} rows={sdk.byEnvironment} />
      <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
        {sdk.versions.map((row) => (
          <div
            key={`${row.release}-${row.environment}`}
            className="rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
          >
            <span className="text-[var(--admin-text)]">{row.release}</span> ·{" "}
            {row.environment} · {row.heartbeats} HB · {row.errors} errors ·{" "}
            {formatRelative(row.lastSeen, locale)}
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
  const { dict, locale } = useDictionary();
  const t = dict.admin.analytics;
  return (
    <Panel
      title={t.panels.errorAnalytics}
      subtitle={t.panelsDesc.errorAnalytics}
    >
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat
          label={t.stats.frequency}
          value={formatNumber(errors.frequency)}
        />
        <MiniStat
          label={t.stats.avgResolution}
          value={
            errors.averageResolutionSeconds == null
              ? "—"
              : `${Math.round(errors.averageResolutionSeconds / 60)}m`
          }
        />
        <MiniStat
          label={t.stats.projects}
          value={formatNumber(errors.affectedProjects)}
        />
        <MiniStat
          label={t.stats.workspaces}
          value={formatNumber(errors.affectedWorkspaces)}
        />
      </div>
      <p className="mb-2 text-[10px] text-[var(--admin-muted)]">
        {t.errorResolutionFootnote}
      </p>
      <BarTrend
        points={errors.trend}
        color="#f87171"
        label={t.stats.errorTrend}
      />
      <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
        {errors.top.map((row) => (
          <div
            key={row.id}
            className="rounded-lg border border-rose-500/15 px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
          >
            <p className="line-clamp-2 text-[var(--admin-text)]">{row.message}</p>
            {row.occurrences}× · {row.projectName} · {row.workspaceName} ·{" "}
            {formatRelative(row.lastSeen, locale)}
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
  const { dict } = useDictionary();
  const t = dict.admin.analytics;
  return (
    <Panel
      title={t.panels.performanceAnalytics}
      subtitle={t.panelsDesc.performanceAnalytics}
    >
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label={t.stats.avg} value={formatMs(performance.averageMs)} />
        <MiniStat label={t.stats.p50} value={formatMs(performance.p50Ms)} />
        <MiniStat label={t.stats.p95} value={formatMs(performance.p95Ms)} />
        <MiniStat label={t.stats.p99} value={formatMs(performance.p99Ms)} />
      </div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {t.topEndpoints}
      </p>
      <div className="max-h-56 space-y-1 overflow-y-auto">
        {performance.slowEndpoints.length === 0 ? (
          <Empty>{t.empty}</Empty>
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
  const { dict } = useDictionary();
  const t = dict.admin.analytics;
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {title}
      </p>
      <div className="max-h-36 space-y-1 overflow-y-auto">
        {rows.length === 0 ? (
          <Empty>{t.empty}</Empty>
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
