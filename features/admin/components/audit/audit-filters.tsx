"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { ADMIN_ROUTES } from "@/lib/constants";
import type { AuditCenterData } from "@/services/admin/audit-center.types";

export function AuditFilters({
  options,
}: {
  options: AuditCenterData["filterOptions"];
}) {
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
        <p className="admin-eyebrow">Search & filters</p>
        <div className="flex flex-wrap items-center gap-2">
          {pending ? (
            <span className="text-[10px] text-[var(--admin-muted)]">Updating…</span>
          ) : null}
          <a
            href={`${exportBase}?format=csv&${exportQuery}`}
            className="admin-btn-ghost"
          >
            Export CSV
          </a>
          <a
            href={`${exportBase}?format=json&${exportQuery}`}
            className="admin-btn-ghost"
          >
            Export JSON
          </a>
          <a
            href={ADMIN_ROUTES.auditLogs}
            className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-accent-text)]"
          >
            Reset
          </a>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <input
          className="admin-select xl:col-span-2"
          placeholder="Search user, workspace, project, action, email…"
          defaultValue={searchParams.get("q") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              update("q", (e.target as HTMLInputElement).value.trim());
            }
          }}
          onBlur={(e) => update("q", e.target.value.trim())}
          aria-label="Search audit events"
        />
        <select
          className="admin-select"
          value={searchParams.get("range") ?? "30d"}
          onChange={(e) => update("range", e.target.value)}
          aria-label="Date range"
        >
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7d</option>
          <option value="30d">Last 30d</option>
          <option value="90d">Last 90d</option>
          <option value="all">All time</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("severity") ?? ""}
          onChange={(e) => update("severity", e.target.value)}
          aria-label="Severity"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("category") ?? ""}
          onChange={(e) => update("category", e.target.value)}
          aria-label="Category"
        >
          <option value="">All categories</option>
          <option value="security">Security</option>
          <option value="admin">Admin</option>
          <option value="workspace">Workspace</option>
          <option value="user">User</option>
          <option value="system">System</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("actorRole") ?? ""}
          onChange={(e) => update("actorRole", e.target.value)}
          aria-label="Actor role"
        >
          <option value="">All actor roles</option>
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
          aria-label="Workspace"
        >
          <option value="">All workspaces</option>
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
          aria-label="Project"
        >
          <option value="">All projects</option>
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
          aria-label="Result"
        >
          <option value="">All results</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="unknown">Unknown</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("action") ?? ""}
          onChange={(e) => update("action", e.target.value)}
          aria-label="Action"
        >
          <option value="">All actions</option>
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
          aria-label="From date"
        />
        <input
          type="date"
          className="admin-select"
          value={searchParams.get("to")?.slice(0, 10) ?? ""}
          onChange={(e) => update("to", e.target.value)}
          aria-label="To date"
        />
      </div>
    </div>
  );
}