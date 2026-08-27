"use client";

import type { ExecutiveDashboardData } from "@/services/admin/executive-dashboard.types";
import { hasAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import { useDictionary } from "@/components/i18n/locale-provider";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { MetricCard } from "@/features/admin/components/executive/metric-card";
import { SectionCard } from "@/features/admin/components/executive/section-card";
import { RangeTabs } from "@/features/admin/components/executive/range-tabs";
import { UsageChart } from "@/features/admin/components/executive/usage-chart";
import { HealthDot } from "@/features/admin/components/executive/health-dot";
import { SeverityBadge } from "@/features/admin/components/executive/severity-badge";
import {
  formatMs,
  formatNumber,
  formatPercent,
  formatRelative,
  formatWhen,
} from "@/features/admin/components/executive/format";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-header";

interface ExecutiveDashboardProps {
  data: ExecutiveDashboardData;
  role: AdminPlatformRole;
}

const QUICK_ACTION_KEY: Record<
  string,
  "createAdmin" | "broadcast" | "maintenance" | "generateKey" | "monitoring" | "security"
> = {
  "create-admin": "createAdmin",
  broadcast: "broadcast",
  maintenance: "maintenance",
  "generate-key": "generateKey",
  monitoring: "monitoring",
  security: "security",
};

export function ExecutiveDashboard({ data, role }: ExecutiveDashboardProps) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.executive;
  const common = dict.admin.common;
  const shell = dict.admin.shell;
  const { kpis } = data;

  const kpiCards = [
    { label: t.metrics.totalUsers, value: formatNumber(kpis.totalUsers) },
    {
      label: t.metrics.activeUsers24h,
      value: formatNumber(kpis.activeUsers24h),
      hint: t.metrics.activeUsersHint,
    },
    { label: t.metrics.totalWorkspaces, value: formatNumber(kpis.totalWorkspaces) },
    { label: t.metrics.totalProjects, value: formatNumber(kpis.totalProjects) },
    {
      label: t.metrics.totalApiKeys,
      value: formatNumber(kpis.totalApiKeys),
      hint: t.metrics.totalApiKeysHint,
    },
    { label: t.metrics.aiRequestsToday, value: formatNumber(kpis.aiRequestsToday) },
    { label: t.metrics.errorsToday, value: formatNumber(kpis.errorsToday) },
    {
      label: t.metrics.incidents,
      value: formatNumber(kpis.openIncidents),
      hint: t.metrics.incidentsHint,
    },
    {
      label: t.metrics.averageResponseTime,
      value: formatMs(kpis.averageResponseTimeMs),
      hint: t.metrics.averageResponseTimeHint,
    },
    {
      label: t.metrics.uptime,
      value: formatPercent(kpis.uptimePercent30d),
      hint: t.metrics.uptimeHint,
    },
  ];

  const usageDesc =
    data.range === "24h"
      ? t.usageChartsDesc24h
      : data.range === "7d"
        ? t.usageChartsDesc7d
        : t.usageChartsDesc30d;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={fillTemplate(t.description, {
          when: formatWhen(data.generatedAt),
        })}
        actions={<RangeTabs range={data.range} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((card, index) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
            delay={index * 0.02}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <SectionCard
          title={t.liveActivity}
          description={t.liveActivityDesc}
          className="xl:col-span-3"
        >
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {data.activity.length === 0 ? (
              <li className="text-sm text-[var(--admin-muted)]">
                {t.liveActivityEmpty}
              </li>
            ) : (
              data.activity.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--admin-text)]">
                        {t.activity[item.kind] ?? item.title}
                      </p>
                      <p className="truncate text-xs text-[var(--admin-muted)]">
                        {item.description}
                      </p>
                    </div>
                    <time
                      className="shrink-0 text-[11px] text-[var(--admin-muted)]"
                      dateTime={item.occurredAt}
                    >
                      {formatRelative(item.occurredAt, locale)}
                    </time>
                  </div>
                </li>
              ))
            )}
          </ul>
        </SectionCard>

        <SectionCard
          title={t.monitoringSummary}
          description={t.monitoringSummaryDesc}
          className="xl:col-span-2"
        >
          <ul className="space-y-2">
            {data.monitoring.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2.5"
              >
                <HealthDot tone={item.tone} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--admin-text)]">
                    {t.monitoringLabels[item.id] ?? item.label}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title={t.usageCharts} description={usageDesc}>
        <UsageChart data={data.usage} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title={t.geographicUsage}
          description={t.geographicUsageDesc}
        >
          {data.geography.countries.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">{t.geographicEmpty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                  <tr>
                    <th className="pb-2 font-medium">{t.country}</th>
                    <th className="pb-2 font-medium">{t.sessions}</th>
                    <th className="pb-2 font-medium">{t.users}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.geography.countries.map((row) => (
                    <tr
                      key={row.country}
                      className="border-t border-[var(--admin-border)]"
                    >
                      <td className="py-2 text-[var(--admin-text)]">{row.country}</td>
                      <td className="py-2 text-[var(--admin-muted)]">
                        {formatNumber(row.sessions)}
                      </td>
                      <td className="py-2 text-[var(--admin-muted)]">
                        {formatNumber(row.users)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-[var(--admin-muted)]">{t.cityNote}</p>
        </SectionCard>

        <SectionCard title={t.quickActions} description={t.quickActionsDesc}>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.quickActions.map((action) => {
              const allowed = hasAdminPermission(role, action.permission);
              const interactive = action.enabled && allowed && action.href;
              const qaKey = QUICK_ACTION_KEY[action.id];
              const qa = qaKey ? t.quickActionItems[qaKey] : null;
              const label = qa?.label ?? action.label;
              const description = qa?.description ?? action.description;
              if (interactive && action.href) {
                return (
                  <a
                    key={action.id}
                    href={action.href}
                    className="admin-accent-ring rounded-xl border border-[var(--admin-border-strong)] bg-[var(--admin-accent-soft)] px-3 py-3 transition-opacity hover:opacity-90"
                  >
                    <p className="text-sm font-medium text-[var(--admin-text)]">
                      {label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">
                      {description}
                    </p>
                  </a>
                );
              }
              return (
                <div
                  key={action.id}
                  className="cursor-not-allowed rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-3 opacity-45"
                  title={
                    !allowed
                      ? shell.insufficientPermissions
                      : shell.availableLater
                  }
                  aria-disabled="true"
                >
                  <p className="text-sm font-medium text-[var(--admin-text)]">
                    {label}
                  </p>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    {description}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title={t.securityOverview}
          description={t.securityOverviewDesc}
        >
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                {t.failedKeyAuth24h}
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">
                {formatNumber(data.security.failedApiKeyAuth24h)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                {t.suspiciousSignals}
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">
                {formatNumber(data.security.suspiciousCount24h)}
              </p>
            </div>
          </div>
          <p className="mb-2 text-xs text-[var(--admin-muted)]">{t.blockedSignal}</p>
          <p className="mb-3 text-xs text-[var(--admin-muted)]">{t.rateLimitNote}</p>
          <ul className="max-h-56 space-y-2 overflow-y-auto">
            {data.security.newest.length === 0 ? (
              <li className="text-sm text-[var(--admin-muted)]">
                {t.failedAuthEmpty}
              </li>
            ) : (
              data.security.newest.map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm"
                >
                  <p className="text-[var(--admin-text)]">{t.authFailedTitle}</p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {event.detail.startsWith("IP ")
                      ? fillTemplate(t.ipDetail, {
                          ip: event.detail.slice(3),
                        })
                      : common.ipUnknown}{" "}
                    · {formatRelative(event.occurredAt, locale)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </SectionCard>

        <SectionCard
          title={t.recentIncidents}
          description={t.recentIncidentsDesc}
        >
          <IncidentGroup title={t.incidentOpen} items={data.incidents.open} none={common.none} />
          <IncidentGroup
            title={t.incidentMonitoring}
            items={data.incidents.monitoring}
            none={common.none}
          />
          <IncidentGroup
            title={t.incidentResolved}
            items={data.incidents.resolved}
            none={common.none}
          />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title={t.apiOverview} description={t.apiOverviewDesc}>
          {data.api.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">{t.apiEmpty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                  <tr>
                    <th className="pb-2 font-medium">{t.endpoint}</th>
                    <th className="pb-2 font-medium">{t.traffic}</th>
                    <th className="pb-2 font-medium">{t.failures}</th>
                    <th className="pb-2 font-medium">{t.latency}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.api.map((row) => (
                    <tr
                      key={row.endpoint}
                      className="border-t border-[var(--admin-border)]"
                    >
                      <td className="max-w-[16rem] truncate py-2 text-[var(--admin-text)]">
                        {row.endpoint}
                      </td>
                      <td className="py-2 text-[var(--admin-muted)]">
                        {formatNumber(row.traffic)}
                      </td>
                      <td className="py-2 text-[var(--admin-muted)]">
                        {formatNumber(row.failures)}
                      </td>
                      <td className="py-2 text-[var(--admin-muted)]">
                        {formatMs(row.avgLatencyMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title={t.aiOverview} description={t.aiOverviewDesc}>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                {t.aiRequests}
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">
                {formatNumber(data.ai.requestsInRange)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                {t.aiTokens}
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">
                {formatNumber(data.ai.tokensInRange)}
              </p>
            </div>
          </div>
          <p className="mb-3 text-xs text-[var(--admin-muted)]">
            {fillTemplate(t.aiLatency, {
              value:
                data.ai.averageLatencyMs == null
                  ? t.aiLatencyMissing
                  : formatMs(data.ai.averageLatencyMs),
            })}
          </p>
          {data.ai.models.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">{t.aiEmpty}</p>
          ) : (
            <ul className="space-y-2">
              {data.ai.models.map((model) => (
                <li
                  key={model.model}
                  className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm"
                >
                  <span className="font-medium text-[var(--admin-text)]">
                    {model.model}
                  </span>
                  <span className="text-[var(--admin-muted)]">
                    {fillTemplate(t.reqTok, {
                      requests: formatNumber(model.requests),
                      tokens: formatNumber(model.tokens),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function IncidentGroup({
  title,
  items,
  none,
}: {
  title: string;
  items: ExecutiveDashboardData["incidents"]["open"];
  none: string;
}) {
  const { locale } = useDictionary();
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--admin-muted)]">{none}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[var(--admin-border)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-[var(--admin-text)]">
                  {item.title}
                </p>
                <p className="text-[11px] text-[var(--admin-muted)]">
                  {item.status} · {formatRelative(item.detectedAt, locale)}
                </p>
              </div>
              <SeverityBadge severity={item.severity} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
