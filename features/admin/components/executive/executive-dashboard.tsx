import type { ExecutiveDashboardData } from "@/services/admin/executive-dashboard.types";
import { hasAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
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

export function ExecutiveDashboard({ data, role }: ExecutiveDashboardProps) {
  const { kpis } = data;

  const kpiCards = [
    { label: "Total Users", value: formatNumber(kpis.totalUsers) },
    {
      label: "Active Users (24h)",
      value: formatNumber(kpis.activeUsers24h),
      hint: "Distinct sessions",
    },
    { label: "Total Workspaces", value: formatNumber(kpis.totalWorkspaces) },
    { label: "Total Projects", value: formatNumber(kpis.totalProjects) },
    {
      label: "Total API Keys",
      value: formatNumber(kpis.totalApiKeys),
      hint: "Active keys",
    },
    { label: "AI Requests Today", value: formatNumber(kpis.aiRequestsToday) },
    { label: "Errors Today", value: formatNumber(kpis.errorsToday) },
    {
      label: "Incidents",
      value: formatNumber(kpis.openIncidents),
      hint: "Not resolved",
    },
    {
      label: "Average Response Time",
      value: formatMs(kpis.averageResponseTimeMs),
      hint: "Client TTFB (24h)",
    },
    {
      label: "Uptime",
      value: formatPercent(kpis.uptimePercent30d),
      hint: "30d from incidents",
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Control plane"
        title="Executive Dashboard"
        description={`Live platform telemetry · generated ${formatWhen(data.generatedAt)}`}
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
          title="Live Activity"
          description="Newest platform events first"
          className="xl:col-span-3"
        >
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {data.activity.length === 0 ? (
              <li className="text-sm text-[var(--admin-muted)]">
                No recent activity in the last 14 days.
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
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-[var(--admin-muted)]">
                        {item.description}
                      </p>
                    </div>
                    <time
                      className="shrink-0 text-[11px] text-[var(--admin-muted)]"
                      dateTime={item.occurredAt}
                    >
                      {formatRelative(item.occurredAt)}
                    </time>
                  </div>
                </li>
              ))
            )}
          </ul>
        </SectionCard>

        <SectionCard
          title="Monitoring Summary"
          description="Live subsystem probes"
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
                    {item.label}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Usage Charts"
        description={`Series for ${data.range === "24h" ? "the last 24 hours" : data.range === "7d" ? "the last 7 days" : "the last 30 days"}`}
      >
        <UsageChart data={data.usage} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Geographic Usage"
          description="Top countries from session geo headers"
        >
          {data.geography.countries.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">
              No country data yet. Sessions populate country when the host
              provides geo headers (e.g. Vercel).
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                  <tr>
                    <th className="pb-2 font-medium">Country</th>
                    <th className="pb-2 font-medium">Sessions</th>
                    <th className="pb-2 font-medium">Users</th>
                  </tr>
                </thead>
                <tbody>
                  {data.geography.countries.map((row) => (
                    <tr
                      key={row.country}
                      className="border-t border-[var(--admin-border)]"
                    >
                      <td className="py-2 text-[var(--admin-text)]">
                        {row.country}
                      </td>
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
          <p className="mt-3 text-xs text-[var(--admin-muted)]">
            {data.geography.cityNote}
          </p>
        </SectionCard>

        <SectionCard
          title="Quick Actions"
          description="Actions unlock as admin modules ship"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {data.quickActions.map((action) => {
              const allowed = hasAdminPermission(role, action.permission);
              const interactive = action.enabled && allowed && action.href;
              if (interactive && action.href) {
                return (
                  <a
                    key={action.id}
                    href={action.href}
                    className="admin-accent-ring rounded-xl border border-[var(--admin-border-strong)] bg-[var(--admin-accent-soft)] px-3 py-3 transition-opacity hover:opacity-90"
                  >
                    <p className="text-sm font-medium text-[var(--admin-text)]">
                      {action.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">
                      {action.description}
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
                      ? "Insufficient permissions"
                      : "Available in a later phase"
                  }
                  aria-disabled="true"
                >
                  <p className="text-sm font-medium text-[var(--admin-text)]">
                    {action.label}
                  </p>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    {action.description}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Security Overview"
          description="API key auth failures and platform signals"
        >
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                Failed key auth (24h)
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">
                {formatNumber(data.security.failedApiKeyAuth24h)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                Suspicious signals
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">
                {formatNumber(data.security.suspiciousCount24h)}
              </p>
            </div>
          </div>
          <p className="mb-2 text-xs text-[var(--admin-muted)]">
            {data.security.blockedSignal}
          </p>
          <p className="mb-3 text-xs text-[var(--admin-muted)]">
            {data.security.rateLimitNote}
          </p>
          <ul className="max-h-56 space-y-2 overflow-y-auto">
            {data.security.newest.length === 0 ? (
              <li className="text-sm text-[var(--admin-muted)]">
                No failed API key authentications in the last 24 hours.
              </li>
            ) : (
              data.security.newest.map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm"
                >
                  <p className="text-[var(--admin-text)]">{event.title}</p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {event.detail} · {formatRelative(event.occurredAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </SectionCard>

        <SectionCard title="Recent Incidents" description="By lifecycle status">
          <IncidentGroup title="Open" items={data.incidents.open} />
          <IncidentGroup
            title="Monitoring"
            items={data.incidents.monitoring}
          />
          <IncidentGroup title="Resolved" items={data.incidents.resolved} />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="API Overview"
          description="Top URLs from performance + error ingest"
        >
          {data.api.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">
              No endpoint traffic in this range.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                  <tr>
                    <th className="pb-2 font-medium">Endpoint</th>
                    <th className="pb-2 font-medium">Traffic</th>
                    <th className="pb-2 font-medium">Failures</th>
                    <th className="pb-2 font-medium">Latency</th>
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

        <SectionCard
          title="AI Overview"
          description="Usage from ai_usage metering"
        >
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                Requests
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">
                {formatNumber(data.ai.requestsInRange)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-[var(--admin-muted)]">
                Tokens
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">
                {formatNumber(data.ai.tokensInRange)}
              </p>
            </div>
          </div>
          <p className="mb-3 text-xs text-[var(--admin-muted)]">
            Average latency:{" "}
            {data.ai.averageLatencyMs == null
              ? "not recorded in ai_usage"
              : formatMs(data.ai.averageLatencyMs)}
          </p>
          {data.ai.models.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">
              No AI usage in this range.
            </p>
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
                    {formatNumber(model.requests)} req ·{" "}
                    {formatNumber(model.tokens)} tok
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
}: {
  title: string;
  items: ExecutiveDashboardData["incidents"]["open"];
}) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--admin-muted)]">None</p>
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
                  {item.status} · {formatRelative(item.detectedAt)}
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
