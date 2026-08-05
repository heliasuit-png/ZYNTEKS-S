"use client";

import { useState, useTransition, type ReactNode } from "react";
import { motion } from "framer-motion";

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
      label: "Security score",
      value: String(data.overview.securityScore),
      hint: `Risk ${data.overview.riskLevel}`,
    },
    {
      label: "Failed auth",
      value: formatNumber(data.overview.failedApiAuth),
      hint: "Login failures + API auth_failed",
    },
    {
      label: "Successful logins",
      value: formatNumber(data.overview.successfulSessions),
      hint: "auth_login_events / sessions",
    },
    {
      label: "Blocked requests",
      value: data.overview.blockedRequests == null ? "—" : formatNumber(data.overview.blockedRequests),
      hint: "Not persisted",
    },
    {
      label: "Suspended users",
      value: formatNumber(data.overview.suspendedUsers),
      hint: "profiles.status = banned",
    },
    {
      label: "Admin accounts",
      value: formatNumber(data.overview.adminAccounts),
      hint: "admin_users",
    },
    {
      label: "API key failures",
      value: formatNumber(data.overview.apiKeyFailures),
      hint: "auth_failed events",
    },
    {
      label: "Security events",
      value: formatNumber(data.overview.securityEvents),
      hint: "Filtered timeline count",
    },
    {
      label: "Risk level",
      value: data.overview.riskLevel,
      hint: `${data.overview.activeSessions} active sessions`,
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Zero Trust plane"
        title="Enterprise Security Center"
        description="Auth signals, API key abuse, admin actions, and session control — real telemetry only."
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
        Honest gaps: {data.unavailable.join(" · ")}. Updated{" "}
        {formatRelative(data.generatedAt)}.
      </p>
    </div>
  );
}

function ThreatCenter({
  threats,
}: {
  threats: SecurityCenterData["threats"];
}) {
  const buckets: { key: SecuritySeverity; label: string }[] = [
    { key: "critical", label: "Critical" },
    { key: "high", label: "High" },
    { key: "medium", label: "Medium" },
    { key: "low", label: "Low" },
  ];

  return (
    <Panel title="Threat center" subtitle="Severity buckets + timeline">
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
          <AdminEmptyState title="No threats in filter scope." />
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
                {formatRelative(item.occurredAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function RiskPanel({ risk }: { risk: SecurityCenterData["risk"] }) {
  const max = 100;
  return (
    <Panel title="Risk analysis" subtitle="Score · trend · recommendations">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase text-[var(--admin-muted)]">
            Overall risk score
          </p>
          <p className="text-3xl font-semibold text-[var(--admin-text)]">
            {risk.overallScore}
          </p>
          <p className={`text-sm capitalize ${SEVERITY_TONE[risk.riskLevel]}`}>
            {risk.riskLevel} risk
          </p>
        </div>
        <div
          className="flex h-16 items-end gap-0.5"
          role="img"
          aria-label="Risk trend"
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
  return (
    <Panel
      title="Login security"
      subtitle="Product auth_login_events · sessions fallback · API auth_failed"
    >
      <SectionLabel>Recent logins</SectionLabel>
      <SessionList rows={panel.recentLogins} />
      <SectionLabel>Failed API authentication</SectionLabel>
      {panel.failedApiAuth.length === 0 ? (
        <Empty>No API auth failures in range.</Empty>
      ) : (
        <div className="mb-3 max-h-40 space-y-1 overflow-y-auto">
          {panel.failedApiAuth.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-rose-500/15 px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
            >
              {item.summary} · {item.ipAddress ?? "IP unknown"} ·{" "}
              {formatRelative(item.occurredAt)}
            </div>
          ))}
        </div>
      )}
      <SectionLabel>
        Flagged (unknown device / country · new browser / IP)
      </SectionLabel>
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
  if (rows.length === 0) return <Empty>None.</Empty>;
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
            {formatRelative(row.createdAt)}
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
  return (
    <Panel title="Active sessions" subtitle="Revoke unknown devices">
      <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
        {sessions.length === 0 ? (
          <AdminEmptyState title="No active sessions." />
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
                      current
                    </span>
                  ) : null}
                </p>
                <p className="text-[10px] text-[var(--admin-muted)]">
                  {session.browser ?? "—"} · {session.os ?? "—"} ·{" "}
                  {session.deviceLabel ?? "—"} · {session.country ?? "—"} ·{" "}
                  {session.ipAddress ?? "—"} ·{" "}
                  {formatRelative(session.lastActiveAt)}
                </p>
              </div>
              {canRevoke ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onRevoke(session.id)}
                  className="rounded-lg border border-rose-500/30 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
                >
                  Revoke
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
  return (
    <Panel title="API security" subtitle="Auth failures · keys · abuse">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Failed auth" value={formatNumber(panel.failedAuth)} />
        <MiniStat
          label="Successful auth"
          value={formatNumber(panel.successfulAuth)}
        />
        <MiniStat label="Revoked keys" value={formatNumber(panel.revokedKeys)} />
        <MiniStat
          label="Expired keys"
          value={panel.expiredKeys == null ? "—" : formatNumber(panel.expiredKeys)}
        />
      </div>
      <SectionLabel>Most used API keys</SectionLabel>
      <div className="mb-3 max-h-36 space-y-1 overflow-y-auto">
        {panel.mostUsed.length === 0 ? (
          <Empty>No usage events.</Empty>
        ) : (
          panel.mostUsed.map((key) => (
            <div
              key={key.id}
              className="rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
            >
              <span className="text-[var(--admin-text)]">{key.name}</span> ·{" "}
              {key.keyPrefix}… · {key.projectName} · {key.useEvents} events
              {key.lastUsedAt ? ` · ${formatRelative(key.lastUsedAt)}` : ""}
            </div>
          ))
        )}
      </div>
      <SectionLabel>API abuse attempts (≥3 failures / IP)</SectionLabel>
      <div className="mb-3 max-h-28 space-y-1 overflow-y-auto">
        {panel.abuseAttempts.length === 0 ? (
          <Empty>No abuse clusters.</Empty>
        ) : (
          panel.abuseAttempts.map((row) => (
            <div
              key={`${row.ipAddress}-${row.lastSeen}`}
              className="rounded-lg border border-rose-500/15 px-2 py-1.5 text-[11px] text-rose-200/80"
            >
              {row.ipAddress ?? "unknown IP"} · {row.failures} failures ·{" "}
              {formatRelative(row.lastSeen)}
            </div>
          ))
        )}
      </div>
      <SectionLabel>Recent failures</SectionLabel>
      <div className="max-h-28 space-y-1 overflow-y-auto">
        {panel.recentFailures.map((row) => (
          <div
            key={row.id}
            className="rounded-lg border border-[var(--admin-border)] px-2 py-1 text-[11px] text-[var(--admin-muted)]"
          >
            {row.projectName ?? "Project"} · {row.ipAddress ?? "—"} ·{" "}
            {formatRelative(row.createdAt)}
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
  return (
    <Panel title="Admin security" subtitle="Accounts · roles · recent actions">
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
              {account.email} · last login{" "}
              {account.lastLogin ? formatWhen(account.lastLogin) : "—"} ·{" "}
              {account.recentActions} actions in range
            </p>
            <p className="mt-1 line-clamp-2 text-[10px] text-[var(--admin-accent-text)]/70">
              {account.permissions.join(" · ")}
            </p>
          </div>
        ))}
      </div>
      <SectionLabel>Recent admin actions</SectionLabel>
      <div className="max-h-40 space-y-1 overflow-y-auto">
        {panel.recentActions.length === 0 ? (
          <Empty>No admin audit rows.</Empty>
        ) : (
          panel.recentActions.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
            >
              <span className="text-[var(--admin-text)]">{item.action}</span> ·{" "}
              {item.summary} · {formatRelative(item.occurredAt)}
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
  return (
    <Panel title="Audit center" subtitle="Filterable security timeline">
      <div className="max-h-[480px] space-y-1.5 overflow-y-auto">
        {items.length === 0 ? (
          <AdminEmptyState title="No audit events match filters." />
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
  const counts = {
    open: alerts.filter((a) => a.status === "open").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
  };

  return (
    <Panel
      title="Security alerts"
      subtitle="Derived from API abuse, incidents, suspensions · dismiss state not stored"
    >
      <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
        <MiniStat label="Open" value={String(counts.open)} />
        <MiniStat label="Acknowledged" value={String(counts.acknowledged)} />
        <MiniStat label="Resolved" value={String(counts.resolved)} />
      </div>
      <p className="mb-2 text-[10px] text-[var(--admin-muted)]">
        Dismissed: not persisted in schema.
      </p>
      <div className="max-h-80 space-y-1.5 overflow-y-auto">
        {alerts.length === 0 ? (
          <Empty>No current alerts.</Empty>
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
