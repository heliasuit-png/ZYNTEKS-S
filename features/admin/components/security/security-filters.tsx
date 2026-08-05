"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { ADMIN_ROUTES } from "@/lib/constants";
import type { SecurityCenterData } from "@/services/admin/security-center.types";

export function SecurityFilters({
  options,
}: {
  options: SecurityCenterData["filterOptions"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (q === current) return;
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [q, pathname, router, searchParams]);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="admin-glass admin-panel space-y-3 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="admin-eyebrow">Security filters</p>
        <div className="flex items-center gap-3">
          {pending ? (
            <span className="text-[10px] text-[var(--admin-muted)]">Updating…</span>
          ) : null}
          <a
            href={ADMIN_ROUTES.security}
            className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-accent-text)]"
          >
            Reset
          </a>
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">Search security</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search user, workspace, project, API key…"
          className="admin-accent-ring w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <select
          className="admin-select"
          value={searchParams.get("severity") ?? ""}
          onChange={(e) => update("severity", e.target.value)}
          aria-label="Filter by severity"
        >
          <option value="">Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("eventType") ?? ""}
          onChange={(e) => update("eventType", e.target.value)}
          aria-label="Filter by event type"
        >
          <option value="">Event type</option>
          <option value="api_auth_failed">API auth failed</option>
          <option value="api_auth_success">API auth success</option>
          <option value="api_key_revoked">API key revoked</option>
          <option value="session_created">Session created</option>
          <option value="session_revoked">Session revoked</option>
          <option value="user_suspended">User suspended</option>
          <option value="admin_action">Admin action</option>
          <option value="incident">Incident</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("range") ?? "24h"}
          onChange={(e) => update("range", e.target.value)}
          aria-label="Date range"
        >
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7d</option>
          <option value="30d">Last 30d</option>
        </select>
        <input
          className="admin-select"
          type="date"
          value={searchParams.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
          aria-label="From date"
        />
        <select
          className="admin-select"
          value={searchParams.get("role") ?? ""}
          onChange={(e) => update("role", e.target.value)}
          aria-label="Filter by admin role"
        >
          <option value="">Admin role</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPPORT">Support</option>
          <option value="READ_ONLY">Read Only</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("workspaceId") ?? ""}
          onChange={(e) => update("workspaceId", e.target.value)}
          aria-label="Filter by workspace"
        >
          <option value="">Workspace</option>
          {options.workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
