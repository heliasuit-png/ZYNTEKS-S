"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Search } from "lucide-react";

import { Badge } from "@/components/dashboard/badge";
import { Button } from "@/components/dashboard/button";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import { AUDIT_ACTION_LABELS } from "@/lib/constants";
import { formatDateTime, formatRelativeTime } from "@/utils/format";
import type { AuditLog } from "@/services/workspace/audit.service";
import type { AuditAction } from "@/types/database";

export function AuditView({
  logs,
  csv,
}: {
  logs: AuditLog[];
  csv: string;
}) {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string>("all");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (action !== "all" && log.action !== action) return false;
      if (!q) return true;
      return (
        log.summary.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.resource_type ?? "").toLowerCase().includes(q)
      );
    });
  }, [logs, search, action]);

  const actions = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action))).sort(),
    [logs],
  );

  function exportCsv() {
    startTransition(() => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zynteksis-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <Panel>
          <PanelHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <PanelTitle>Enterprise audit log</PanelTitle>
            <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zt-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search actions…"
                  className="w-full rounded-xl border border-zt-border bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-zt-text outline-none focus:border-zt-primary"
                />
              </div>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="rounded-xl border border-zt-border bg-white/[0.02] px-3 py-2 text-sm text-zt-text"
              >
                <option value="all">All actions</option>
                {actions.map((a) => (
                  <option key={a} value={a}>
                    {AUDIT_ACTION_LABELS[a as AuditAction] ?? a}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={exportCsv}
                disabled={pending || !csv}
              >
                <Download className="size-4" aria-hidden />
                Export CSV
              </Button>
            </div>
          </PanelHeader>
          <PanelContent>
            {filtered.length === 0 ? (
              <p className="text-sm text-zt-muted">No audit events match your filters.</p>
            ) : (
              <ol className="relative space-y-0 border-l border-zt-border pl-6">
                {filtered.map((log) => (
                  <li key={log.id} className="relative pb-6 last:pb-0">
                    <span className="absolute -left-[31px] top-1.5 size-2.5 rounded-full bg-zt-primary shadow-[0_0_12px_var(--color-zt-primary)]" />
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-zt-text">
                          {log.summary}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge tone="primary">
                            {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                          </Badge>
                          {log.resource_type ? (
                            <Badge tone="default">{log.resource_type}</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right text-xs text-zt-muted">
                        <p>{formatRelativeTime(log.created_at)}</p>
                        <p>{formatDateTime(log.created_at)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </PanelContent>
        </Panel>
      </FadeIn>
    </div>
  );
}
