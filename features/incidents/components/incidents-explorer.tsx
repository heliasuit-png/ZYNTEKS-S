"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Search, Siren } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Pagination } from "@/components/dashboard/pagination";
import { FadeIn } from "@/components/dashboard/motion";
import { DataTable } from "@/components/dashboard/data-table";
import type { Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/dashboard/badge";
import { CopyButton } from "@/components/dashboard/copy-button";
import {
  API_KEY_ENVIRONMENTS,
  API_KEY_ENVIRONMENT_LABELS,
  DASHBOARD_ROUTES,
  INCIDENT_SEVERITIES,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUSES,
  INCIDENT_STATUS_LABELS,
} from "@/lib/constants";
import { formatDateTime, formatDuration, formatRelativeTime } from "@/utils/format";
import {
  INCIDENT_SEVERITY_TONE,
  INCIDENT_STATUS_TONE,
} from "@/features/incidents/lib/status";
import type { Incident } from "@/types/dashboard";

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

export function IncidentsExplorer({
  incidents,
  projects,
  total,
  page,
  pageSize,
  search,
  filters,
}: IncidentsExplorerProps) {
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

  const columns: Column<Incident>[] = [
    {
      key: "title",
      header: "Incident",
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
      header: "Status",
      render: (incident) => (
        <Badge tone={INCIDENT_STATUS_TONE[incident.status]}>
          {INCIDENT_STATUS_LABELS[incident.status]}
        </Badge>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (incident) => (
        <Badge tone={INCIDENT_SEVERITY_TONE[incident.severity]}>
          {INCIDENT_SEVERITY_LABELS[incident.severity]}
        </Badge>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (incident) => (
        <span className="text-zt-muted">{incident.projectName}</span>
      ),
    },
    {
      key: "environment",
      header: "Env",
      render: (incident) => (
        <span className="capitalize text-zt-muted">
          {incident.environment ?? "—"}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      render: (incident) => (
        <span className="tabular-nums text-zt-muted">
          {formatDuration(incident.durationSeconds)}
        </span>
      ),
    },
    {
      key: "started",
      header: "Started",
      align: "right",
      render: (incident) => (
        <span className="text-zt-muted" title={formatDateTime(incident.startedAt)}>
          {formatRelativeTime(incident.startedAt)}
        </span>
      ),
    },
    {
      key: "resolved",
      header: "Resolved",
      align: "right",
      render: (incident) => (
        <span className="text-zt-muted">
          {incident.resolvedAt
            ? formatRelativeTime(incident.resolvedAt)
            : "—"}
        </span>
      ),
    },
    {
      key: "assignee",
      header: "Assignee",
      render: (incident) => (
        <span className="text-zt-muted">{incident.assignee}</span>
      ),
    },
    {
      key: "ai",
      header: "AI recommendation",
      render: (incident) => (
        <span className="line-clamp-2 max-w-[14rem] text-xs text-zt-muted">
          {incident.aiRecommendation ?? "—"}
        </span>
      ),
    },
  ];

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
              placeholder="Search title, description, or incident ID…"
              aria-label="Search incidents"
              className="h-9 w-full rounded-xl border border-zt-border bg-zt-surface pl-9 pr-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value={copyPayload} label="Copy JSON" />
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zt-border bg-zt-surface-2 px-2.5 py-1.5 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
            >
              <Download className="size-3.5" aria-hidden />
              Export CSV
            </button>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-zt-primary hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by project"
            value={filters.projectId}
            onChange={(e) => updateParam("projectId", e.target.value)}
            className={selectClass}
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) => updateParam("status", e.target.value)}
            className={selectClass}
          >
            <option value="">All statuses</option>
            {INCIDENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {INCIDENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by severity"
            value={filters.severity}
            onChange={(e) => updateParam("severity", e.target.value)}
            className={selectClass}
          >
            <option value="">All severities</option>
            {INCIDENT_SEVERITIES.map((severity) => (
              <option key={severity} value={severity}>
                {INCIDENT_SEVERITY_LABELS[severity]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by environment"
            value={filters.environment}
            onChange={(e) => updateParam("environment", e.target.value)}
            className={selectClass}
          >
            <option value="">All environments</option>
            {API_KEY_ENVIRONMENTS.map((env) => (
              <option key={env} value={env}>
                {API_KEY_ENVIRONMENT_LABELS[env]}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort by"
            value={filters.sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className={selectClass}
          >
            <option value="started_at">Sort: Started</option>
            <option value="severity">Sort: Severity</option>
            <option value="status">Sort: Status</option>
            <option value="resolved_at">Sort: Resolved</option>
          </select>
          <select
            aria-label="Sort direction"
            value={filters.sortDir}
            onChange={(e) => updateParam("sortDir", e.target.value)}
            className={selectClass}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-zt-muted">
            From
            <input
              type="date"
              value={filters.from}
              onChange={(e) => updateParam("from", e.target.value)}
              aria-label="From date"
              className={selectClass}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-zt-muted">
            To
            <input
              type="date"
              value={filters.to}
              onChange={(e) => updateParam("to", e.target.value)}
              aria-label="To date"
              className={selectClass}
            />
          </label>
        </div>
      </div>

      <p className="text-xs text-zt-muted">
        {total} incident{total === 1 ? "" : "s"}
        {hasActiveFilters ? " matching filters" : ""}
      </p>

      {incidents.length === 0 ? (
        <EmptyState
          icon={Siren}
          title={hasActiveFilters ? "No matching incidents" : "No incidents"}
          description={
            hasActiveFilters
              ? "Try adjusting search or filters."
              : "There are no incidents to report. All clear."
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white"
              >
                Clear filters
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
