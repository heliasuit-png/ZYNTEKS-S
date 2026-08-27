"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { ADMIN_ROUTES } from "@/lib/constants";
import type { SecurityCenterData } from "@/services/admin/security-center.types";

export function SecurityFilters({
  options,
}: {
  options: SecurityCenterData["filterOptions"];
}) {
  const { dict } = useDictionary();
  const t = dict.admin.security.filters;
  const common = dict.admin.common;
  const roles = dict.admin.roles;
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
        <p className="admin-eyebrow">{t.title}</p>
        <div className="flex items-center gap-3">
          {pending ? (
            <span className="text-[10px] text-[var(--admin-muted)]">
              {common.updating}
            </span>
          ) : null}
          <a
            href={ADMIN_ROUTES.security}
            className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-accent-text)]"
          >
            {common.reset}
          </a>
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">{t.searchLabel}</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="admin-accent-ring w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <select
          className="admin-select"
          value={searchParams.get("severity") ?? ""}
          onChange={(e) => update("severity", e.target.value)}
          aria-label={t.ariaSeverity}
        >
          <option value="">{t.severity}</option>
          <option value="critical">{common.severityCritical}</option>
          <option value="high">{common.severityHigh}</option>
          <option value="medium">{common.severityMedium}</option>
          <option value="low">{common.severityLow}</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("eventType") ?? ""}
          onChange={(e) => update("eventType", e.target.value)}
          aria-label={t.ariaEventType}
        >
          <option value="">{t.eventType}</option>
          <option value="api_auth_failed">{t.eventTypes.api_auth_failed}</option>
          <option value="api_auth_success">{t.eventTypes.api_auth_success}</option>
          <option value="api_key_revoked">{t.eventTypes.api_key_revoked}</option>
          <option value="session_created">{t.eventTypes.session_created}</option>
          <option value="session_revoked">{t.eventTypes.session_revoked}</option>
          <option value="user_suspended">{t.eventTypes.user_suspended}</option>
          <option value="admin_action">{t.eventTypes.admin_action}</option>
          <option value="incident">{t.eventTypes.incident}</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("range") ?? "24h"}
          onChange={(e) => update("range", e.target.value)}
          aria-label={common.dateRange}
        >
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
          value={searchParams.get("role") ?? ""}
          onChange={(e) => update("role", e.target.value)}
          aria-label={t.ariaRole}
        >
          <option value="">{t.adminRole}</option>
          <option value="SUPER_ADMIN">{roles.super_admin}</option>
          <option value="ADMIN">{roles.admin}</option>
          <option value="SUPPORT">{roles.support}</option>
          <option value="READ_ONLY">{roles.read_only}</option>
        </select>
        <select
          className="admin-select"
          value={searchParams.get("workspaceId") ?? ""}
          onChange={(e) => update("workspaceId", e.target.value)}
          aria-label={t.ariaWorkspace}
        >
          <option value="">{t.workspace}</option>
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
