"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bug, Download, Search } from "lucide-react";

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
} from "@/lib/constants";
import { ERROR_LEVEL_TONE } from "@/features/errors/lib/level-tone";
import { formatDate, formatRelativeTime } from "@/utils/format";
import type { ErrorEvent, ErrorLevel } from "@/types/dashboard";

const selectClass =
  "h-9 rounded-xl border border-zt-border bg-zt-surface px-3 text-sm text-zt-text focus:outline-none focus:ring-2 focus:ring-zt-primary/40";

const LEVELS: ErrorLevel[] = ["fatal", "error", "warning", "info", "debug"];

interface ProjectOption {
  id: string;
  name: string;
}

interface ErrorsFilters {
  projectId: string;
  environment: string;
  level: string;
  release: string;
  activity: string;
  from: string;
  to: string;
}

interface ErrorsExplorerProps {
  errors: ErrorEvent[];
  projects: ProjectOption[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  filters: ErrorsFilters;
}

export function ErrorsExplorer({
  errors,
  projects,
  total,
  page,
  pageSize,
  search,
  filters,
}: ErrorsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(search);
  const [releaseValue, setReleaseValue] = useState(filters.release);
  const isFirstRender = useRef(true);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  useEffect(() => {
    setReleaseValue(filters.release);
  }, [filters.release]);

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

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (releaseValue === filters.release) return;
      const params = new URLSearchParams(searchParams.toString());
      if (releaseValue.trim()) params.set("release", releaseValue.trim());
      else params.delete("release");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [releaseValue, filters.release, pathname, router, searchParams]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.replace(pathname);
  }

  async function downloadCsv() {
    const params = new URLSearchParams(searchParams.toString());
    const response = await fetch(`/api/errors/export?${params.toString()}`);
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zynteksis-errors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasActiveFilters = Boolean(
    search ||
      filters.projectId ||
      filters.environment ||
      filters.level ||
      filters.release ||
      filters.activity ||
      filters.from ||
      filters.to,
  );

  const columns: Column<ErrorEvent>[] = [
    {
      key: "message",
      header: "Error group",
      render: (event) => (
        <div className="min-w-0 max-w-md">
          <Link
            href={`${DASHBOARD_ROUTES.errors}/${event.id}`}
            className="line-clamp-2 font-medium text-zt-text transition-colors hover:text-zt-primary"
          >
            {event.message}
          </Link>
          <p className="mt-0.5 truncate font-mono text-[11px] text-zt-muted">
            {event.fingerprint.slice(0, 16)}…
          </p>
        </div>
      ),
    },
    {
      key: "level",
      header: "Severity",
      render: (event) => (
        <Badge tone={ERROR_LEVEL_TONE[event.level]}>{event.level}</Badge>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (event) => (
        <span className="text-zt-muted">{event.projectName}</span>
      ),
    },
    {
      key: "environment",
      header: "Env",
      render: (event) => (
        <span className="capitalize text-zt-muted">{event.environment}</span>
      ),
    },
    {
      key: "occurrences",
      header: "Occurrences",
      align: "right",
      render: (event) => (
        <span className="tabular-nums text-zt-text">{event.occurrences}</span>
      ),
    },
    {
      key: "lastSeen",
      header: "Last seen",
      align: "right",
      render: (event) => (
        <span
          className="text-zt-muted"
          title={formatDate(event.lastSeenAt)}
        >
          {formatRelativeTime(event.lastSeenAt)}
        </span>
      ),
    },
  ];

  const csvPreview = errors
    .map(
      (e) =>
        `${e.id},${JSON.stringify(e.message)},${e.level},${e.occurrences},${e.environment}`,
    )
    .join("\n");

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
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search message, URL, project, release…"
              aria-label="Search errors"
              className="h-9 w-full rounded-xl border border-zt-border bg-zt-surface pl-9 pr-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              value={csvPreview || "id,message,level,occurrences,environment"}
              label="Copy"
            />
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
            onChange={(event) => updateParam("projectId", event.target.value)}
            className={selectClass}
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by severity"
            value={filters.level}
            onChange={(event) => updateParam("level", event.target.value)}
            className={selectClass}
          >
            <option value="">All severities</option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by environment"
            value={filters.environment}
            onChange={(event) => updateParam("environment", event.target.value)}
            className={selectClass}
          >
            <option value="">All environments</option>
            {API_KEY_ENVIRONMENTS.map((environment) => (
              <option key={environment} value={environment}>
                {API_KEY_ENVIRONMENT_LABELS[environment]}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by activity"
            value={filters.activity}
            onChange={(event) => updateParam("activity", event.target.value)}
            className={selectClass}
          >
            <option value="">Active & quiet</option>
            <option value="unresolved">Unresolved (seen in 7d)</option>
            <option value="resolved">Resolved / quiet (7d+)</option>
          </select>

          <input
            type="search"
            value={releaseValue}
            onChange={(event) => setReleaseValue(event.target.value)}
            placeholder="Release"
            aria-label="Filter by release"
            className="h-9 w-32 rounded-xl border border-zt-border bg-zt-surface px-3 text-sm text-zt-text placeholder:text-zt-muted focus:outline-none focus:ring-2 focus:ring-zt-primary/40"
          />

          <label className="flex items-center gap-1.5 text-xs text-zt-muted">
            From
            <input
              type="date"
              value={filters.from}
              onChange={(event) => updateParam("from", event.target.value)}
              aria-label="From date"
              className={selectClass}
            />
          </label>

          <label className="flex items-center gap-1.5 text-xs text-zt-muted">
            To
            <input
              type="date"
              value={filters.to}
              onChange={(event) => updateParam("to", event.target.value)}
              aria-label="To date"
              className={selectClass}
            />
          </label>
        </div>
      </div>

      <p className="text-xs text-zt-muted">
        {total} error group{total === 1 ? "" : "s"}
        {hasActiveFilters ? " matching filters" : ""}
      </p>

      {errors.length === 0 ? (
        <EmptyState
          icon={Bug}
          title={hasActiveFilters ? "No matching errors" : "No errors captured"}
          description={
            hasActiveFilters
              ? "Try adjusting search or filters."
              : "Install the SDK and send a test error — grouped issues will appear here."
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
              >
                Clear filters
              </button>
            ) : (
              <Link
                href={DASHBOARD_ROUTES.projects}
                className="inline-flex items-center gap-2 rounded-xl bg-zt-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
              >
                Go to Projects
              </Link>
            )
          }
        />
      ) : (
        <FadeIn>
          <DataTable
            columns={columns}
            rows={errors}
            getRowId={(event) => event.id}
          />
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
