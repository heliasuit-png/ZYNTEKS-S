"use client";

import { useState, useTransition, type ReactNode } from "react";
import { motion } from "framer-motion";

import { useDictionary } from "@/components/i18n/locale-provider";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { hasAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import type {
  SecurityCenterData,
  SecuritySeverity,
} from "@/services/admin/security-center.types";
import {
  formatNumber,
  formatRelative,
  formatWhen,
} from "@/features/admin/components/executive/format";
import { SecurityFilters } from "@/features/admin/components/security/security-filters";
import { revokeSessionAction } from "@/features/admin/security-actions";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-header";
import { AdminEmptyState } from "@/features/admin/components/ui/admin-empty-state";
import { ADMIN_KPI_STAGGER } from "@/features/admin/components/ui/admin-motion";

const SEVERITY_TONE: Record<SecuritySeverity, string> = {
  critical: "text-rose-300",
  high: "text-orange-300",
  medium: "text-amber-300",
  low: "text-sky-300",
};

export function SecurityCenter({
  data,
  role,
}: {
  data: SecurityCenterData;
  role: AdminPlatformRole;
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.security;
  const canRevoke = hasAdminPermission(role, "admin:users:write");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function revoke(sessionId: string) {
    startTransition(async () => {
      const result = await revokeSessionAction(sessionId);
      setMessage(result.message);
    });
  }

  const kpis = [
    {
      label: t.metrics.securityScore,
      value: String(data.overview.securityScore),
      hint: `${t.metrics.riskLevel} ${data.overview.riskLevel}`,
    },
    {
      label: t.metrics.failedAuth,
      value: formatNumber(data.overview.failedApiAuth),
      hint: t.metricsHints.failedAuth,
    },
    {
      label: t.metrics.successfulLogins,
      value: formatNumber(data.overview.successfulSessions),
      hint: "auth_login_events / sessions",
    },
    {
      label: t.metrics.blockedRequests,
      value:
        data.overview.blockedRequests == null
          ? "—"
          : formatNumber(data.overview.blockedRequests),
      hint: t.metricsHints.blockedRequests,
    },
    {
      label: t.metrics.suspendedUsers,
      value: formatNumber(data.overview.suspendedUsers),
      hint: "profiles.status = banned",
    },
    {
      label: t.metrics.adminAccounts,
      value: formatNumber(data.overview.adminAccounts),
      hint: "admin_users",
    },
    {
      label: t.metrics.apiKeyFailures,
      value: formatNumber(data.overview.apiKeyFailures),
      hint: t.metrics.apiKeyFailuresHint,
    },
    {
      label: t.metrics.securityEvents,
      value: formatNumber(data.overview.securityEvents),
      hint: t.metricsHints.securityEvents,
    },
    {
      label: t.metrics.riskLevel,
      value: data.overview.riskLevel,
      hint: `${data.overview.activeSessions} ${t.activeSessions.toLowerCase()}`,
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow={t.eyebrow}
        title={t.pageTitle}
        description={t.description}
      />

      {message ? (
        <p className="rounded-xl border border-[var(--admin-border-strong)] bg-[var(--admin-accent-soft)] px-3 py-2 text-xs text-[var(--admin-accent-text)]">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9">
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
            <p className="mt-1 text-lg font-semibold capitalize text-[var(--admin-text)]">
              {card.value}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--admin-accent-text)]">
              {card.hint}
            </p>
          </motion.article>
        ))}
      </div>

      <SecurityFilters options={data.filterOptions} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ThreatCenter threats={data.threats} />
        <RiskPanel risk={data.risk} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LoginSecurity panel={data.loginSecurity} />
        <ActiveSessions
          sessions={data.activeSessions}
          canRevoke={canRevoke}
          pending={pending}
          onRevoke={revoke}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ApiSecurity panel={data.apiSecurity} />
        <AdminSecurity panel={data.adminSecurity} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AuditCenter items={data.audit} />
        <AlertCenter alerts={data.alerts} />
      </div>

      <p className="text-[11px] text-[var(--admin-muted)]">
        {fillTemplate(t.honestGapsUpdated, {
          items: data.unavailable.join(" · "),
          when: formatRelative(data.generatedAt, locale),
        })}
      </p>
    </div>
  );
}

function ThreatCenter({
  threats,
}: {
  threats: SecurityCenterData["threats"];
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.security;
  const common = dict.admin.common;
  const buckets: { key: SecuritySeverity; label: string }[] = [
    { key: "critical", label: common.severityCritical },
    { key: "high", label: common.severityHigh },
    { key: "medium", label: common.severityMedium },
    { key: "low", label: common.severityLow },
  ];

  return (
    <Panel title={t.threatCenter} subtitle={t.threatCenterDesc}>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {buckets.map((bucket) => (
          <div
            key={bucket.key}
            className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-2 text-center"
          >
            <p className="text-[10px] uppercase text-[var(--admin-muted)]">
              {bucket.label}
            </p>
            <p className={`text-lg font-semibold ${SEVERITY_TONE[bucket.key]}`}>
              {threats[bucket.key].length}
            </p>
          </div>
        ))}
      </div>
      <div className="max-h-80 space-y-1.5 overflow-y-auto">
        {threats.timeline.length === 0 ? (
          <AdminEmptyState title={t.threatEmpty} />
        ) : (
          threats.timeline.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[var(--admin-text)]">{item.title}</p>
                <span className={`uppercase ${SEVERITY_TONE[item.severity]}`}>
                  {item.severity}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-[var(--admin-muted)]">
                {item.source} · {item.userEmail ?? "—"} ·{" "}
                {item.workspaceName ?? "—"} · {item.projectName ?? "—"} ·{" "}
                {formatRelative(item.occurredAt, locale)}
              </p>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function RiskPanel({ risk }: { risk: SecurityCenterData["risk"] }) {
  const { dict } = useDictionary();
  const t = dict.admin.security;
  const max = 100;
  return (
    <Panel title={t.riskAnalysis} subtitle={t.riskAnalysisDesc}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase text-[var(--admin-muted)]">
            {t.overallRiskScore}
          </p>
          <p className="text-3xl font-semibold text-[var(--admin-text)]">
            {risk.overallScore}
          </p>
          <p className={`text-sm capitalize ${SEVERITY_TONE[risk.riskLevel]}`}>
            {fillTemplate(t.riskLevelLabel, { level: risk.riskLevel })}
          </p>
        </div>
        <div
          className="flex h-16 items-end gap-0.5"
          role="img"
          aria-label={t.riskTrendAria}
        >
          {risk.trend.map((point) => (
            <div
              key={point.label}
              className="min-w-0 flex-1 rounded-t-sm bg-[var(--admin-accent)]/80"
              style={{
                height: `${Math.max(8, (point.score / max) * 100)}%`,
              }}
              title={`${point.label}: ${point.score}`}
            />
          ))}
        </div>
      </div>
      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {risk.recommendations.map((tip) => (
          <li
            key={tip}
            className="rounded-lg border border-[var(--admin-border)] px-2.5 py-2 text-xs text-[var(--admin-muted)]"
          >
            {tip}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function LoginSecurity({
  panel,
}: {
  panel: SecurityCenterData["loginSecurity"];
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.security;
  const common = dict.admin.common;
  return (
    <Panel title={t.loginSecurity} subtitle={t.loginSecurityDesc}>
      <SectionLabel>{t.recentLogins}</SectionLabel>
      <SessionList rows={panel.recentLogins} />
      <SectionLabel>{t.failedApiAuthSection}</SectionLabel>
      {panel.failedApiAuth.length === 0 ? (
        <Empty>{t.noApiAuthFailures}</Empty>
      ) : (
        <div className="mb-3 max-h-40 space-y-1 overflow-y-auto">
          {panel.failedApiAuth.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-rose-500/15 px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
            >
              {item.summary} · {item.ipAddress ?? common.ipUnknown} ·{" "}
              {formatRelative(item.occurredAt, locale)}
            </div>
          ))}
        </div>
      )}
      <SectionLabel>{t.flaggedSessions}</SectionLabel>
      <SessionList rows={panel.flaggedSessions} showFlags />
    </Panel>
  );
}

function SessionList({
  rows,
  showFlags,
}: {
  rows: SecurityCenterData["loginSecurity"]["recentLogins"];
  showFlags?: boolean;
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.security;
  if (rows.length === 0) return <Empty>{t.noneDot}</Empty>;
  return (
    <div className="mb-3 max-h-44 space-y-1 overflow-y-auto">
      {rows.map((row) => (
        <div
          key={row.id}
          className="rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px]"
        >
          <p className="text-[var(--admin-text)]">
            {row.userName || row.userEmail} · {row.deviceLabel ?? row.browser ?? "—"}
          </p>
          <p className="text-[var(--admin-muted)]">
            {row.os ?? "—"} · {row.country ?? "—"} · {row.ipAddress ?? "—"} ·{" "}
            {formatRelative(row.createdAt, locale)}
            {showFlags && row.flags.length > 0
              ? ` · ${row.flags.join(", ")}`
              : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

function ActiveSessions({
  sessions,
  canRevoke,
  pending,
  onRevoke,
}: {
  sessions: SecurityCenterData["activeSessions"];
  canRevoke: boolean;
  pending: boolean;
  onRevoke: (id: string) => void;
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.security;
  return (
    <Panel title={t.activeSessions} subtitle={t.activeSessionsDesc}>
      <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
        {sessions.length === 0 ? (
          <AdminEmptyState title={t.sessionsEmpty} />
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] px-2.5 py-2 text-xs"
            >
              <div className="min-w-0">
                <p className="text-[var(--admin-text)]">
                  {session.userName || session.userEmail}
                  {session.isCurrent ? (
                    <span className="ml-2 text-[10px] text-emerald-300">
                      {t.currentSession}
                    </span>
                  ) : null}
                </p>
                <p className="text-[10px] text-[var(--admin-muted)]">
                  {session.browser ?? "—"} · {session.os ?? "—"} ·{" "}
                  {session.deviceLabel ?? "—"} · {session.country ?? "—"} ·{" "}
                  {session.ipAddress ?? "—"} ·{" "}
                  {formatRelative(session.lastActiveAt, locale)}
                </p>
              </div>
              {canRevoke ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onRevoke(session.id)}
                  className="rounded-lg border border-rose-500/30 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
                >
                  {t.revoke}
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function ApiSecurity({
  panel,
}: {
  panel: SecurityCenterData["apiSecurity"];
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.security;
  const common = dict.admin.common;
  return (
    <Panel title={t.apiSecurity} subtitle={t.apiSecurityDesc}>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat
          label={t.metrics.failedAuth}
          value={formatNumber(panel.failedAuth)}
        />
        <MiniStat
          label={t.api.successfulAuth}
          value={formatNumber(panel.successfulAuth)}
        />
        <MiniStat
          label={t.api.revokedKeys}
          value={formatNumber(panel.revokedKeys)}
        />
        <MiniStat
          label={t.api.expiredKeys}
          value={
            panel.expiredKeys == null ? "—" : formatNumber(panel.expiredKeys)
          }
        />
      </div>
      <SectionLabel>{t.api.mostUsedKeys}</SectionLabel>
      <div className="mb-3 max-h-36 space-y-1 overflow-y-auto">
        {panel.mostUsed.length === 0 ? (
          <Empty>{t.api.noUsageEvents}</Empty>
        ) : (
          panel.mostUsed.map((key) => (
            <div
              key={key.id}
              className="rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
            >
              <span className="text-[var(--admin-text)]">{key.name}</span> ·{" "}
              {key.keyPrefix}… · {key.projectName} ·{" "}
              {fillTemplate(t.useEvents, { count: String(key.useEvents) })}
              {key.lastUsedAt ? ` · ${formatRelative(key.lastUsedAt, locale)}` : ""}
            </div>
          ))
        )}
      </div>
      <SectionLabel>{t.apiAbuseAttempts}</SectionLabel>
      <div className="mb-3 max-h-28 space-y-1 overflow-y-auto">
        {panel.abuseAttempts.length === 0 ? (
          <Empty>{t.noAbuseClusters}</Empty>
        ) : (
          panel.abuseAttempts.map((row) => (
            <div
              key={`${row.ipAddress}-${row.lastSeen}`}
              className="rounded-lg border border-rose-500/15 px-2 py-1.5 text-[11px] text-rose-200/80"
            >
              {row.ipAddress ?? common.ipUnknown} ·{" "}
              {fillTemplate(t.failuresCount, {
                count: String(row.failures),
              })}{" "}
              · {formatRelative(row.lastSeen, locale)}
            </div>
          ))
        )}
      </div>
      <SectionLabel>{t.recentFailures}</SectionLabel>
      <div className="max-h-28 space-y-1 overflow-y-auto">
        {panel.recentFailures.map((row) => (
          <div
            key={row.id}
            className="rounded-lg border border-[var(--admin-border)] px-2 py-1 text-[11px] text-[var(--admin-muted)]"
          >
            {row.projectName ?? t.api.projectFallback} · {row.ipAddress ?? "—"} ·{" "}
            {formatRelative(row.createdAt, locale)}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AdminSecurity({
  panel,
}: {
  panel: SecurityCenterData["adminSecurity"];
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.security;
  return (
    <Panel title={t.adminSecurity} subtitle={t.adminSecurityDesc}>
      <div className="mb-3 max-h-56 space-y-1.5 overflow-y-auto">
        {panel.accounts.map((account) => (
          <div
            key={account.userId}
            className="rounded-lg border border-[var(--admin-border)] px-2.5 py-2 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[var(--admin-text)]">
                {account.fullName || account.email}
              </p>
              <span className="text-[var(--admin-accent-text)]">
                {account.role.replaceAll("_", " ")}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-[var(--admin-muted)]">
              {account.email} · {t.lastLoginLabel}{" "}
              {account.lastLogin ? formatWhen(account.lastLogin) : "—"} ·{" "}
              {fillTemplate(t.actionsInRange, {
                count: String(account.recentActions),
              })}
            </p>
            <p className="mt-1 line-clamp-2 text-[10px] text-[var(--admin-accent-text)]/70">
              {account.permissions.join(" · ")}
            </p>
          </div>
        ))}
      </div>
      <SectionLabel>{t.recentAdminActions}</SectionLabel>
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {panel.recentActions.length === 0 ? (
          <Empty>{t.noAdminAuditRows}</Empty>
        ) : (
          panel.recentActions.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
            >
              <span className="text-[var(--admin-text)]">{item.action}</span> ·{" "}
              {item.summary} · {formatRelative(item.occurredAt, locale)}
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function AuditCenter({
  items,
}: {
  items: SecurityCenterData["audit"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.security;
  return (
    <Panel title={t.auditCenter} subtitle={t.auditCenterDesc}>
      <div className="max-h-[480px] space-y-1.5 overflow-y-auto">
        {items.length === 0 ? (
          <AdminEmptyState title={t.auditEmpty} />
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[var(--admin-text)]">{item.summary}</p>
                <span className={`uppercase ${SEVERITY_TONE[item.severity]}`}>
                  {item.severity}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-[var(--admin-muted)]">
                {item.eventType} · {item.source} · {item.actorEmail ?? "—"} ·{" "}
                {item.ipAddress ?? "—"} · {formatWhen(item.occurredAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function AlertCenter({
  alerts,
}: {
  alerts: SecurityCenterData["alerts"];
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.security;
  const counts = {
    open: alerts.filter((a) => a.status === "open").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
  };

  return (
    <Panel title={t.securityAlerts} subtitle={t.securityAlertsDesc}>
      <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
        <MiniStat label={t.alerts.open} value={String(counts.open)} />
        <MiniStat
          label={t.alerts.acknowledged}
          value={String(counts.acknowledged)}
        />
        <MiniStat label={t.alerts.resolved} value={String(counts.resolved)} />
      </div>
      <p className="mb-2 text-[10px] text-[var(--admin-muted)]">
        {t.dismissedNote}
      </p>
      <div className="max-h-80 space-y-1.5 overflow-y-auto">
        {alerts.length === 0 ? (
          <Empty>{t.noCurrentAlerts}</Empty>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-rose-500/15 px-2.5 py-1.5 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[var(--admin-text)]">{alert.title}</p>
                <span className={`uppercase ${SEVERITY_TONE[alert.severity]}`}>
                  {alert.severity}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-[var(--admin-muted)]">
                {alert.source} · {alert.status} ·{" "}
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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
      {children}
    </p>
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

function Empty({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-xs text-[var(--admin-muted)]">{children}</p>;
}
