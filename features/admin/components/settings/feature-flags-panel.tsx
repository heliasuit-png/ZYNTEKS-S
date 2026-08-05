"use client";

import { useMemo, useState, useTransition } from "react";

import type { FeatureFlagRow } from "@/services/admin/platform-settings.types";
import type { FeatureFlagStatus } from "@/types/database";
import {
  formatRelative,
  formatWhen,
} from "@/features/admin/components/executive/format";
import {
  createFeatureFlagAction,
  updateFeatureFlagStatusAction,
} from "@/features/admin/settings-actions";
import { AdminEmptyState } from "@/features/admin/components/ui/admin-empty-state";

const STATUS_OPTIONS: FeatureFlagStatus[] = [
  "enabled",
  "disabled",
  "beta",
  "internal",
];

const STATUS_CLASS: Record<FeatureFlagStatus, string> = {
  enabled: "bg-emerald-500/15 text-emerald-300",
  disabled: "bg-zinc-500/15 text-zinc-300",
  beta: "bg-amber-500/15 text-amber-200",
  internal: "bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]",
};

export function FeatureFlagsPanel({
  flags,
  canWrite,
}: {
  flags: FeatureFlagRow[];
  canWrite: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return flags.filter((flag) => {
      if (statusFilter !== "all" && flag.status !== statusFilter) return false;
      if (scopeFilter !== "all" && flag.scope !== scopeFilter) return false;
      if (!q) return true;
      return (
        flag.key.toLowerCase().includes(q) ||
        flag.name.toLowerCase().includes(q) ||
        flag.description.toLowerCase().includes(q)
      );
    });
  }, [flags, query, scopeFilter, statusFilter]);

  function setStatus(flagId: string, status: string) {
    startTransition(async () => {
      const result = await updateFeatureFlagStatusAction(flagId, status);
      setMessage(result.message);
    });
  }

  function createFlag(formData: FormData) {
    startTransition(async () => {
      const result = await createFeatureFlagAction({
        key: String(formData.get("key") ?? ""),
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        scope: String(formData.get("scope") ?? "global"),
        status: String(formData.get("status") ?? "disabled"),
      });
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="admin-glass admin-panel space-y-3 rounded-2xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <label className="block text-xs text-[var(--admin-muted)]">
              Search
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Flag, name, description"
                className="admin-select mt-1 w-full"
              />
            </label>
            <label className="block text-xs text-[var(--admin-muted)]">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="admin-select mt-1 w-full"
              >
                <option value="all">All</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-[var(--admin-muted)]">
              Scope
              <select
                value={scopeFilter}
                onChange={(event) => setScopeFilter(event.target.value)}
                className="admin-select mt-1 w-full"
              >
                <option value="all">All</option>
                <option value="global">global</option>
                <option value="workspace">workspace</option>
                <option value="project">project</option>
                <option value="user">user</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-[var(--admin-muted)]">
            {filtered.length} of {flags.length} flags
          </p>
        </div>
      </div>

      {message ? (
        <p className="rounded-xl border border-[var(--admin-border-strong)] bg-[var(--admin-accent-soft)] px-3 py-2 text-xs text-[var(--admin-accent-text)]">
          {message}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <AdminEmptyState
          title="No feature flags match the current filters."
          description="Adjust search or status/scope filters to broaden results."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--admin-surface)] text-[11px] uppercase tracking-wide text-[var(--admin-muted)]">
              <tr>
                <th className="px-3 py-2.5 font-medium">Flag</th>
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 font-medium">Scope</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((flag) => (
                <tr
                  key={flag.id}
                  className="border-t border-[var(--admin-border)] align-top text-[var(--admin-text)]"
                >
                  <td className="px-3 py-3">
                    <p className="font-medium">{flag.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--admin-muted)]">
                      {flag.key}
                    </p>
                  </td>
                  <td className="max-w-xs px-3 py-3 text-[var(--admin-muted)]">
                    {flag.description || "—"}
                  </td>
                  <td className="px-3 py-3 capitalize">{flag.scope}</td>
                  <td className="px-3 py-3">
                    {canWrite ? (
                      <select
                        value={flag.status}
                        disabled={pending}
                        onChange={(event) =>
                          setStatus(flag.id, event.target.value)
                        }
                        className={`rounded-md border border-[var(--admin-border)] px-2 py-1 text-xs capitalize outline-none ${STATUS_CLASS[flag.status]}`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-xs capitalize ${STATUS_CLASS[flag.status]}`}
                      >
                        {flag.status}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-[var(--admin-muted)]">
                    <p title={formatWhen(flag.updatedAt)}>
                      {formatRelative(flag.updatedAt)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canWrite ? (
        <form
          className="grid gap-3 rounded-xl border border-dashed border-[var(--admin-border)] p-4 sm:grid-cols-2 lg:grid-cols-3"
          action={(formData) => createFlag(formData)}
        >
          <p className="admin-eyebrow sm:col-span-2 lg:col-span-3">
            Create feature flag
          </p>
          <label className="block text-xs text-[var(--admin-muted)]">
            Key
            <input
              name="key"
              required
              placeholder="module.feature"
              className="admin-select mt-1 w-full"
            />
          </label>
          <label className="block text-xs text-[var(--admin-muted)]">
            Name
            <input
              name="name"
              required
              placeholder="Display name"
              className="admin-select mt-1 w-full"
            />
          </label>
          <label className="block text-xs text-[var(--admin-muted)]">
            Scope
            <select
              name="scope"
              defaultValue="global"
              className="admin-select mt-1 w-full"
            >
              <option value="global">global</option>
              <option value="workspace">workspace</option>
              <option value="project">project</option>
              <option value="user">user</option>
            </select>
          </label>
          <label className="block text-xs text-[var(--admin-muted)] sm:col-span-2">
            Description
            <input
              name="description"
              placeholder="What this flag controls"
              className="admin-select mt-1 w-full"
            />
          </label>
          <label className="block text-xs text-[var(--admin-muted)]">
            Status
            <select
              name="status"
              defaultValue="disabled"
              className="admin-select mt-1 w-full"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              Create flag
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
