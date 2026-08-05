"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";

import type {
  AuditCenterData,
  AuditSeverity,
} from "@/services/admin/audit-center.types";
import {
  formatNumber,
  formatRelative,
  formatWhen,
} from "@/features/admin/components/executive/format";
import { SectionCard } from "@/features/admin/components/executive/section-card";
import { AuditDrawer } from "@/features/admin/components/audit/audit-drawer";
import { AuditFilters } from "@/features/admin/components/audit/audit-filters";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-header";
import { AdminEmptyState } from "@/features/admin/components/ui/admin-empty-state";
import { ADMIN_KPI_STAGGER } from "@/features/admin/components/ui/admin-motion";

const SEVERITY_CLASS: Record<AuditSeverity, string> = {
  critical: "text-rose-300",
  high: "text-orange-300",
  medium: "text-amber-200",
  low: "text-sky-300",
};

export function EnterpriseAuditCenter({ data }: { data: AuditCenterData }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function goPage(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(next));
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  const kpis = [
    { label: "Total audit events", value: data.overview.totalEvents },
    { label: "Today", value: data.overview.today },
    { label: "This week", value: data.overview.thisWeek },
    { label: "Security events", value: data.overview.securityEvents },
    { label: "Admin actions", value: data.overview.adminActions },
    { label: "Workspace actions", value: data.overview.workspaceActions },
    { label: "User actions", value: data.overview.userActions },
    { label: "System actions", value: data.overview.systemActions },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Compliance plane"
        title="Enterprise Audit Center"
        description="Searchable, filterable platform audit trail from admin_audit_logs — real events only."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {kpis.map((card, index) => (
          <motion.article
            key={card.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * ADMIN_KPI_STAGGER, duration: 0.22 }}
            className="admin-glass admin-panel rounded-2xl p-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-[var(--admin-text)]">
              {formatNumber(card.value)}
            </p>
          </motion.article>
        ))}
      </div>

      <AuditFilters options={data.filterOptions} />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Audit table"
          description={`${formatNumber(data.totalFiltered)} matching events · page ${data.page}/${data.pageCount}`}
        >
          {data.events.length === 0 ? (
            <AdminEmptyState
              title="No audit events match the current filters."
              description="Adjust search or filters to broaden results."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)]">
              <table className="min-w-[1100px] w-full text-left text-xs">
                <thead className="bg-[var(--admin-surface)] text-[10px] uppercase tracking-wide text-[var(--admin-muted)]">
                  <tr>
                    <th className="px-2.5 py-2.5 font-medium">Timestamp</th>
                    <th className="px-2.5 py-2.5 font-medium">Actor</th>
                    <th className="px-2.5 py-2.5 font-medium">Role</th>
                    <th className="px-2.5 py-2.5 font-medium">Action</th>
                    <th className="px-2.5 py-2.5 font-medium">Category</th>
                    <th className="px-2.5 py-2.5 font-medium">Target</th>
                    <th className="px-2.5 py-2.5 font-medium">Workspace</th>
                    <th className="px-2.5 py-2.5 font-medium">Project</th>
                    <th className="px-2.5 py-2.5 font-medium">Severity</th>
                    <th className="px-2.5 py-2.5 font-medium">IP</th>
                    <th className="px-2.5 py-2.5 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((event) => (
                    <tr
                      key={event.id}
                      className="cursor-pointer border-t border-[var(--admin-border)] text-[var(--admin-text)] transition hover:bg-[var(--admin-accent-soft)]"
                      onClick={() => setSelectedId(event.id)}
                    >
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-[var(--admin-muted)]">
                        <span title={formatWhen(event.timestamp)}>
                          {formatRelative(event.timestamp)}
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5">
                        {event.actorEmail || event.actorName || "—"}
                      </td>
                      <td className="px-2.5 py-2.5">{event.actorRole ?? "—"}</td>
                      <td className="px-2.5 py-2.5">{event.actionLabel}</td>
                      <td className="px-2.5 py-2.5 capitalize">{event.category}</td>
                      <td className="px-2.5 py-2.5">
                        <p>{event.targetName ?? "—"}</p>
                        <p className="text-[10px] text-[var(--admin-muted)]">
                          {event.targetType}
                        </p>
                      </td>
                      <td className="px-2.5 py-2.5">
                        {event.workspaceName ?? "—"}
                      </td>
                      <td className="px-2.5 py-2.5">
                        {event.projectName ?? "—"}
                      </td>
                      <td
                        className={`px-2.5 py-2.5 capitalize ${SEVERITY_CLASS[event.severity]}`}
                      >
                        {event.severity}
                      </td>
                      <td className="px-2.5 py-2.5 font-mono text-[10px]">
                        {event.ipAddress ?? "—"}
                      </td>
                      <td className="px-2.5 py-2.5 capitalize">{event.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[var(--admin-muted)]">
            <button
              type="button"
              disabled={pending || data.page <= 1}
              onClick={() => goPage(data.page - 1)}
              className="admin-btn-ghost disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {data.page} of {data.pageCount}
            </span>
            <button
              type="button"
              disabled={pending || data.page >= data.pageCount}
              onClick={() => goPage(data.page + 1)}
              className="admin-btn-ghost disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Timeline"
          description="Newest first · open an event for full metadata"
        >
          {data.timeline.length === 0 ? (
            <AdminEmptyState title="No timeline events in this window." />
          ) : (
            <ol className="space-y-3">
              {data.timeline.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(event.id)}
                    className="flex w-full gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2.5 text-left transition hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-accent-soft)]"
                  >
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--admin-accent)]" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-[var(--admin-text)]">
                          {event.actionLabel}
                        </span>
                        <span
                          className={`text-[10px] uppercase ${SEVERITY_CLASS[event.severity]}`}
                        >
                          {event.severity}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--admin-muted)]">
                        {event.summary}
                      </span>
                      <span className="mt-1 block text-[10px] text-[var(--admin-muted)]">
                        {formatRelative(event.timestamp)} ·{" "}
                        {event.actorEmail || "unknown actor"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <InsightCard title="Most common actions" rows={data.insights.mostCommonActions} />
        <InsightCard title="Most active admins" rows={data.insights.mostActiveAdmins} />
        <InsightCard
          title="Most modified workspaces"
          rows={data.insights.mostModifiedWorkspaces}
        />
        <InsightCard title="Most modified users" rows={data.insights.mostModifiedUsers} />
        <InsightCard title="Top security events" rows={data.insights.topSecurityEvents} />
        <SectionCard title="Retention" description="Storage policy for admin_audit_logs">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-[var(--admin-muted)]">
                Retention policy
              </dt>
              <dd className="mt-1 text-[var(--admin-text)]">
                {data.retention.policy}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-[var(--admin-muted)]">
                Stored records
              </dt>
              <dd className="mt-1 text-[var(--admin-text)]">
                {formatNumber(data.retention.storedRecords)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-[var(--admin-muted)]">
                Oldest record
              </dt>
              <dd className="mt-1 text-[var(--admin-text)]">
                {data.retention.oldestRecordAt
                  ? formatWhen(data.retention.oldestRecordAt)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-[var(--admin-muted)]">
                Newest record
              </dt>
              <dd className="mt-1 text-[var(--admin-text)]">
                {data.retention.newestRecordAt
                  ? formatWhen(data.retention.newestRecordAt)
                  : "—"}
              </dd>
            </div>
            <p className="text-xs text-[var(--admin-muted)]">
              {data.retention.note}
            </p>
          </dl>
        </SectionCard>
      </div>

      {data.unavailable.length > 0 ? (
        <p className="text-xs text-[var(--admin-muted)]">
          Honest gaps: {data.unavailable.join(", ")}
        </p>
      ) : null}

      <AuditDrawer eventId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function InsightCard({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; label: string; count: number }[];
}) {
  return (
    <SectionCard title={title}>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm"
          >
            <span className="truncate text-[var(--admin-text)]">{row.label}</span>
            <span className="shrink-0 font-semibold text-[var(--admin-accent-text)]">
              {formatNumber(row.count)}
            </span>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="text-xs text-[var(--admin-muted)]">No data in window.</li>
        ) : null}
      </ul>
    </SectionCard>
  );
}
