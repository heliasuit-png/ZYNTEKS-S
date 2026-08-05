"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { ADMIN_ROUTES } from "@/lib/constants";
import type { AiOpsData } from "@/services/admin/ai-operations.types";

export function AiOpsFilters({ options }: { options: AiOpsData["filterOptions"] }) {
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

  const exportQuery = searchParams.toString();

  return (
    <div className="admin-glass admin-panel space-y-3 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="admin-eyebrow">AI filters & export</p>
        <div className="flex flex-wrap items-center gap-2">
          {pending ? (
            <span className="text-[10px] text-[var(--admin-muted)]">Updating…</span>
          ) : null}
          <a
            href={`/api/admin/ai/export?format=csv&${exportQuery}`}
            className="admin-btn-ghost"
          >
            Export CSV
          </a>
          <a
            href={`/api/admin/ai/export?format=json&${exportQuery}`}
            className="admin-btn-ghost"
          >
            Export JSON
          </a>
          <a
            href={ADMIN_ROUTES.ai}
            className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-accent-text)]"
          >
            Reset
          </a>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
        </select>
        <input
          className="admin-select"
          type="date"
          value={searchParams.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
          aria-label="From date"
        />
        <input
          className="admin-select"
          type="date"
          value={searchParams.get("to") ?? ""}
          onChange={(e) => update("to", e.target.value)}
          aria-label="To date"
        />
        <select
          className="admin-select"
          value={workspaceId}
          onChange={(e) => update("workspaceId", e.target.value)}
          aria-label="Workspace"
        >
          <option value="">Workspace</option>
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
          <option value="">Project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          className="admin-select"
          value={searchParams.get("model") ?? ""}
          onChange={(e) => update("model", e.target.value)}
          aria-label="Model"
        >
          <option value="">Model</option>
          {options.models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <select
          className="admin-select"
          value={searchParams.get("environment") ?? ""}
          onChange={(e) => update("environment", e.target.value)}
          aria-label="Environment (not stored on AI usage)"
          title="Environment is not stored on AI usage rows"
        >
          <option value="">Environment (n/a)</option>
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="development">Development</option>
        </select>
      </div>
      <p className="text-[10px] text-[var(--admin-muted)]">
        Environment is not a column on `ai_usage` / conversations — filter is UI
        parity only and does not change results.
      </p>
    </div>
  );
}
