"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { ADMIN_ROUTES } from "@/lib/constants";
import type { AuditCenterData } from "@/services/admin/audit-center.types";

export function AuditFilters({
  options,
}: {
  options: AuditCenterData["filterOptions"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.audit.filters;
  const common = dict.admin.common;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "workspaceId") params.delete("projectId");
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  const workspaceId = searchParams.get("workspaceId") ?? "";
  const projects = workspaceId
    ? options.projects.filter((p) => p.workspaceId === workspaceId)
    : options.projects;

  const exportBase = "/api/admin/audit/export";
  const exportQuery = searchParams.toString();

  return (
    <div className="admin-glass admin-panel space-y-3 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="admin-eyebrow">{t.title}</p>
        <div className="flex flex-wrap items-center gap-2">
          {pending ? (
            <span className="text-[10px] text-[var(--admin-muted)]">
              {common.updating}
            </span>
          ) : null}
          <a
            href={`${exportBase}?format=csv&${exportQuery}`}
            className="admin-btn-ghost"
          >
            {common.exportCsv}
          </a>
          <a
            href={`${exportBase}?format=json&${exportQuery}`}
            className="admin-btn-ghost"
          >
            {common.exportJson}
          </a>
          <a
            href={ADMIN_ROUTES.auditLogs}
            className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-accent-text)]"
          >
            {common.reset}
          </a>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <input
          className="admin-select xl:col-span-2"
          placeholder={t.searchPlaceholder}
          defaultValue={searchParams.get("q") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              update("q", (e.target as HTMLInputElement).value.trim());
            }
          }}
          onBlur={(e) => update("q", e.target.value.trim())}
          aria-label={t.searchAria}
        />
        <select
          className="admin-select"
          value={searchParams.get("range") ?? "30d"}
          onChange={(e) => update("range", e.target.value)}
          aria-label={common.dateRange}
        >
          <option value="24h">{common.range24h}</option>
          <option value="7d">{common.range7d}</option>
          <option value="30d">{common.range30d}</option>
          <option value="90d">{common.range90d}</option>
          <option value="all">{common.rangeAll}</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("severity") ?? ""}
          onChange={(e) => update("severity", e.target.value)}
          aria-label={common.severity}
        >
          <option value="">{t.allSeverities}</option>
          <option value="critical">{common.severityCritical}</option>
          <option value="high">{common.severityHigh}</option>
          <option value="medium">{common.severityMedium}</option>
          <option value="low">{common.severityLow}</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("category") ?? ""}
          onChange={(e) => update("category", e.target.value)}
          aria-label={t.category}
        >
          <option value="">{t.allCategories}</option>
          <option value="security">{t.categorySecurity}</option>
          <option value="admin">{t.categoryAdmin}</option>
          <option value="workspace">{t.categoryWorkspace}</option>
          <option value="user">{t.categoryUser}</option>
          <option value="system">{t.categorySystem}</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("actorRole") ?? ""}
          onChange={(e) => update("actorRole", e.target.value)}
          aria-label={t.actorRole}
        >
          <option value="">{t.allActorRoles}</option>
          {options.actorRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          className="admin-select"
          value={workspaceId}
          onChange={(e) => update("workspaceId", e.target.value)}
          aria-label={common.workspace}
        >
          <option value="">{t.allWorkspaces}</option>
          {options.workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
        <select
          className="admin-select"
          value={searchParams.get("projectId") ?? ""}
          onChange={(e) => update("projectId", e.target.value)}
          aria-label={common.project}
        >
          <option value="">{t.allProjects}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          className="admin-select"
          value={searchParams.get("result") ?? ""}
          onChange={(e) => update("result", e.target.value)}
          aria-label={t.result}
        >
          <option value="">{t.allResults}</option>
          <option value="success">{t.resultSuccess}</option>
          <option value="failure">{t.resultFailure}</option>
          <option value="unknown">{t.resultUnknown}</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("action") ?? ""}
          onChange={(e) => update("action", e.target.value)}
          aria-label={t.action}
        >
          <option value="">{t.allActions}</option>
          {options.actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="admin-select"
          value={searchParams.get("from")?.slice(0, 10) ?? ""}
          onChange={(e) => update("from", e.target.value)}
          aria-label={common.fromDate}
        />
        <input
          type="date"
          className="admin-select"
          value={searchParams.get("to")?.slice(0, 10) ?? ""}
          onChange={(e) => update("to", e.target.value)}
          aria-label={common.toDate}
        />
      </div>
    </div>
  );
}
