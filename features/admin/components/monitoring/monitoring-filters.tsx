"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { ADMIN_ROUTES } from "@/lib/constants";
import type { MonitoringMissionData } from "@/services/admin/monitoring-mission.types";

export function MonitoringFilters({
  options,
}: {
  options: MonitoringMissionData["filterOptions"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.monitoring.filters;
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
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  const workspaceId = searchParams.get("workspaceId") ?? "";
  const projects = workspaceId
    ? options.projects.filter((p) => p.workspaceId === workspaceId)
    : options.projects;

  return (
    <div className="admin-glass admin-panel space-y-3 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="admin-eyebrow">{t.title}</p>
        <div className="flex items-center gap-3">
          {pending ? (
            <span className="text-[10px] text-[var(--admin-muted)]">
              {common.updating}
            </span>
          ) : null}
          <a
            href={ADMIN_ROUTES.monitoring}
            className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-accent-text)]"
          >
            {common.reset}
          </a>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        <select
          className="admin-select"
          value={workspaceId}
          onChange={(e) => update("workspaceId", e.target.value)}
          aria-label={t.ariaWorkspace}
        >
          <option value="">{common.workspace}</option>
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
          aria-label={t.ariaProject}
        >
          <option value="">{common.project}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <input
          className="admin-select"
          placeholder={common.country}
          defaultValue={searchParams.get("country") ?? ""}
          onBlur={(e) => update("country", e.target.value.trim())}
          aria-label={t.ariaCountry}
        />
        <select
          className="admin-select"
          value={searchParams.get("environment") ?? ""}
          onChange={(e) => update("environment", e.target.value)}
          aria-label={t.ariaEnvironment}
        >
          <option value="">{common.environment}</option>
          <option value="production">{common.envProduction}</option>
          <option value="staging">{common.envStaging}</option>
          <option value="development">{common.envDevelopment}</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("range") ?? "24h"}
          onChange={(e) => update("range", e.target.value)}
          aria-label={common.dateRange}
        >
          <option value="1h">{common.range1h}</option>
          <option value="24h">{common.range24h}</option>
          <option value="7d">{common.range7d}</option>
          <option value="30d">{common.range30d}</option>
        </select>
        <input
          className="admin-select"
          type="date"
          value={searchParams.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
          aria-label={common.fromDate}
        />
        <select
          className="admin-select"
          value={searchParams.get("severity") ?? ""}
          onChange={(e) => update("severity", e.target.value)}
          aria-label={t.ariaSeverity}
        >
          <option value="">{common.severityLevel}</option>
          <option value="critical">{common.severityCritical}</option>
          <option value="high">{common.severityHigh}</option>
          <option value="medium">{common.severityMedium}</option>
          <option value="low">{common.severityLow}</option>
          <option value="fatal">{common.severityFatal}</option>
          <option value="error">{common.severityError}</option>
          <option value="warning">{common.severityWarning}</option>
        </select>
      </div>
    </div>
  );
}
