"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Search, Siren } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Pagination } from "@/components/dashboard/pagination";
import { FadeIn } from "@/components/dashboard/motion";
import { DataTable } from "@/components/dashboard/data-table";
import type { Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/dashboard/badge";
import { CopyButton } from "@/components/dashboard/copy-button";
import {
  API_KEY_ENVIRONMENTS,
  DASHBOARD_ROUTES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
} from "@/lib/constants";
import { formatDateTime, formatDuration, formatRelativeTime } from "@/utils/format";
import {
  INCIDENT_SEVERITY_TONE,
  INCIDENT_STATUS_TONE,
} from "@/features/incidents/lib/status";
import type { Incident } from "@/types/dashboard";
import type {
  ApiKeyEnvironment,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/database";

const selectClass =
  "h-9 rounded-xl border border-zt-border bg-zt-surface px-3 text-sm text-zt-text focus:outline-none focus:ring-2 focus:ring-zt-primary/40";

interface ProjectOption {
  id: string;
  name: string;
}

interface IncidentsFilters {
  projectId: string;
  environment: string;
  status: string;
  severity: string;
  from: string;
  to: string;
  sort: string;
  sortDir: string;
}

interface IncidentsExplorerProps {
  incidents: Incident[];
  projects: ProjectOption[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  filters: IncidentsFilters;
}

function fill(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function IncidentsExplorer({
  incidents,
  projects,
  total,
  page,
  pageSize,
  search,
  filters,
}: IncidentsExplorerProps) {
  const { dict, locale } = useDictionary();
  const t = dict.dash.incidents;
  const common = dict.dashboardCommon;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search);
  const isFirstRender = useRef(true);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      if (searchValue === search) return;
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue.trim()) params.set("q", searchValue.trim());
      else params.delete("q");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [searchValue, search, pathname, router, searchParams]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      if (key !== "page") params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  function goToPage(nextPage: number) {
    updateParam("page", String(nextPage));
  }

  function clearFilters() {
    router.replace(pathname);
  }

  async function downloadCsv() {
    const params = new URLSearchParams(searchParams.toString());
    const response = await fetch(`/api/incidents/export?${params.toString()}`);
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zynteksis-incidents.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasActiveFilters = Boolean(
    search ||
      filters.projectId ||
      filters.environment ||
      filters.status ||
      filters.severity ||
      filters.from ||
      filters.to,
  );

  const copyPayload = JSON.stringify(
    incidents.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      severity: i.severity,
      project: i.projectName,
      environment: i.environment,
      startedAt: i.startedAt,
      resolvedAt: i.resolvedAt,
      durationSeconds: i.durationSeconds,
      assignee: i.assignee,
      aiRecommendation: i.aiRecommendation,
    })),
    null,
    2,
  );

  const columns: Column<Incident>[] = useMemo(
    () => [
      {
        key: "title",
        header: t.colIncident,
        render: (incident) => (
          <div className="min-w-0 max-w-sm">
            <Link
              href={`${DASHBOARD_ROUTES.incidents}/${incident.id}`}
              className="font-medium text-zt-text transition-colors hover:text-zt-primary"
            >
              {incident.title}
            </Link>
            <p className="mt-0.5 truncate font-mono text-[11px] text-zt-muted">
              {incident.id.slice(0, 8)}…
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: t.colStatus,
        render: (incident) => (
          <Badge tone={INCIDENT_STATUS_TONE[incident.status]}>
            {t.statuses[incident.status as IncidentStatus]}
          </Badge>
        ),
      },
      {
        key: "severity",
        header: t.colSeverity,
        render: (incident) => (
          <Badge tone={INCIDENT_SEVERITY_TONE[incident.severity]}>
            {t.severities[incident.severity as IncidentSeverity]}
          </Badge>
        ),
      },
      {
        key: "project",
        header: t.colProject,
        render: (incident) => (
          <span className="text-zt-muted">{incident.projectName}</span>
        ),
      },
      {
        key: "environment",
        header: t.colEnv,
        render: (incident) => (
          <span className="capitalize text-zt-muted">
            {incident.environment
              ? (common.environments[
                  incident.environment as ApiKeyEnvironment
                ] ?? incident.environment)
              : "—"}
          </span>
        ),
      },
      {
        key: "duration",
        header: t.colDuration,
        align: "right",
        render: (incident) => (
          <span className="tabular-nums text-zt-muted">
            {formatDuration(incident.durationSeconds)}
          </span>
        ),
      },
      {
        key: "started",
        header: t.colStarted,
        align: "right",
        render: (incident) => (
          <span
            className="text-zt-muted"
            title={formatDateTime(incident.startedAt)}
          >
            {formatRelativeTime(incident.startedAt, undefined, locale)}
          </span>
        ),
      },
      {
        key: "resolved",
        header: t.colResolved,
        align: "right",
        render: (incident) => (
          <span className="text-zt-muted">
            {incident.resolvedAt
              ? formatRelativeTime(incident.resolvedAt, undefined, locale)
              : "—"}
          </span>
        ),
      },
      {
        key: "assignee",
        header: t.colAssignee,
        render: (incident) => (
          <span className="text-zt-muted">{incident.assignee}</span>
        ),
      },
      {
        key: "ai",
        header: t.colAiRecommendation,
        render: (incident) => (
          <span className="line-clamp-2 max-w-[14rem] text-xs text-zt-muted">
            {incident.aiRecommendation ?? "—"}
          </span>
        ),
      },
    ],
    [t, common.environments],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zt-muted"
              aria-hidden
            />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchAria}
              className="h-9 w-full rounded-xl border border-zt-border bg-zt-surface pl-9 pr-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={copyPayload} label={t.copyJson} />
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zt-border bg-zt-surface-2 px-2.5 py-1.5 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
            >
              <Download className="size-3.5" aria-hidden />
              {t.exportCsv}
            </button>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-zt-primary hover:underline"
              >
                {t.clearFilters}
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t.filterByProject}
            value={filters.projectId}
            onChange={(e) => updateParam("projectId", e.target.value)}
            className={selectClass}
          >
            <option value="">{t.allProjects}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            aria-label={t.filterByStatus}
            value={filters.status}
            onChange={(e) => updateParam("status", e.target.value)}
            className={selectClass}
          >
            <option value="">{t.allStatuses}</option>
            {INCIDENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t.statuses[status]}
              </option>
            ))}
          </select>
          <select
            aria-label={t.filterBySeverity}
            value={filters.severity}
            onChange={(e) => updateParam("severity", e.target.value)}
            className={selectClass}
          >
            <option value="">{t.allSeverities}</option>
            {INCIDENT_SEVERITIES.map((severity) => (
              <option key={severity} value={severity}>
                {t.severities[severity]}
              </option>
            ))}
          </select>
          <select
            aria-label={t.filterByEnvironment}
            value={filters.environment}
            onChange={(e) => updateParam("environment", e.target.value)}
            className={selectClass}
          >
            <option value="">{t.allEnvironments}</option>
            {API_KEY_ENVIRONMENTS.map((env) => (
              <option key={env} value={env}>
                {common.environments[env]}
              </option>
            ))}
          </select>
          <select
            aria-label={t.sortBy}
            value={filters.sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className={selectClass}
          >
            <option value="started_at">{t.sortStarted}</option>
            <option value="severity">{t.sortSeverity}</option>
            <option value="status">{t.sortStatus}</option>
            <option value="resolved_at">{t.sortResolved}</option>
          </select>
          <select
            aria-label={t.sortDirection}
            value={filters.sortDir}
            onChange={(e) => updateParam("sortDir", e.target.value)}
            className={selectClass}
          >
            <option value="desc">{t.newestFirst}</option>
            <option value="asc">{t.oldestFirst}</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-zt-muted">
            {t.from}
            <input
              type="date"
              value={filters.from}
              onChange={(e) => updateParam("from", e.target.value)}
              aria-label={t.from}
              className={selectClass}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-zt-muted">
            {t.to}
            <input
              type="date"
              value={filters.to}
              onChange={(e) => updateParam("to", e.target.value)}
              aria-label={t.to}
              className={selectClass}
            />
          </label>
        </div>
      </div>

      <p className="text-xs text-zt-muted">
        {fill(total === 1 ? t.countSingular : t.countPlural, { count: total })}
        {hasActiveFilters ? t.matchingFilters : ""}
      </p>

      {incidents.length === 0 ? (
        <EmptyState
          icon={Siren}
          title={hasActiveFilters ? t.noMatching : t.noIncidents}
          description={
            hasActiveFilters ? t.emptySearchDesc : t.emptyDesc
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white"
              >
                {t.clearFilters}
              </button>
            ) : undefined
          }
        />
      ) : (
        <FadeIn>
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              rows={incidents}
              getRowId={(incident) => incident.id}
            />
          </div>
          {totalPages > 1 ? (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            </div>
          ) : null}
        </FadeIn>
      )}
    </div>
  );
}
