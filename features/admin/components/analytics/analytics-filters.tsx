"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { ADMIN_ROUTES } from "@/lib/constants";
import type { AnalyticsIntelligenceData } from "@/services/admin/analytics-intelligence.types";

export function AnalyticsFilters({
  options,
}: {
  options: AnalyticsIntelligenceData["filterOptions"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.analytics.filters;
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

  const exportBase = "/api/admin/analytics/export";
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
            href={ADMIN_ROUTES.analytics}
            className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-accent-text)]"
          >
            {common.reset}
          </a>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
        </select>
        <input
          className="admin-select"
          type="date"
          value={searchParams.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
          aria-label={common.fromDate}
        />
        <input
          className="admin-select"
          type="date"
          value={searchParams.get("to") ?? ""}
          onChange={(e) => update("to", e.target.value)}
          aria-label={common.toDate}
        />
        <select
          className="admin-select"
          value={workspaceId}
          onChange={(e) => update("workspaceId", e.target.value)}
          aria-label={common.workspace}
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
          aria-label={common.project}
        >
          <option value="">{common.project}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          className="admin-select"
          value={searchParams.get("environment") ?? ""}
          onChange={(e) => update("environment", e.target.value)}
          aria-label={common.environment}
        >
          <option value="">{common.environment}</option>
          <option value="production">{common.envProduction}</option>
          <option value="staging">{common.envStaging}</option>
          <option value="development">{common.envDevelopment}</option>
        </select>
        <input
          className="admin-select"
          placeholder={common.country}
          defaultValue={searchParams.get("country") ?? ""}
          onBlur={(e) => update("country", e.target.value.trim())}
          aria-label={common.country}
        />
      </div>
    </div>
  );
}
