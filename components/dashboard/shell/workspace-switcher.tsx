"use client";

import { useState, useTransition } from "react";
import { Check, ChevronsUpDown, Command, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  createWorkspaceAction,
  switchWorkspaceAction,
} from "@/features/workspace/actions";
import type { DashboardWorkspaceContext } from "@/features/dashboard/types";
import {
  Dropdown,
  dropdownItemClass,
} from "@/components/dashboard/dropdown";

const PLAN_LABELS: Record<string, string> = {
  free: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function WorkspaceSwitcher({
  workspace,
  collapsed,
}: {
  workspace: DashboardWorkspaceContext;
  collapsed?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const active = workspace.active;
  const planLabel = PLAN_LABELS[active.plan] ?? active.plan;

  function switchTo(id: string) {
    if (id === active.id) return;
    startTransition(async () => {
      await switchWorkspaceAction(id);
    });
  }

  function create() {
    if (!name.trim()) return;
    const fd = new FormData();
    fd.set("name", name.trim());
    startTransition(async () => {
      await createWorkspaceAction({ ok: false }, fd);
      setCreating(false);
      setName("");
    });
  }

  const trigger = (
    <span
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-xl border border-zt-border bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:border-zt-border-strong hover:bg-white/[0.04]",
        collapsed && "justify-center px-0",
        pending && "opacity-70",
      )}
    >
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-md"
        style={{
          background: `linear-gradient(135deg, ${active.brandColor}, #7C3AED)`,
        }}
      >
        {active.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.logoUrl}
            alt=""
            className="size-7 rounded-lg object-cover"
          />
        ) : (
          <Command className="size-3.5" aria-hidden />
        )}
      </span>
      {collapsed ? null : (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-zt-text">
              {active.name}
            </span>
            <span className="block truncate text-[11px] text-zt-muted">
              {planLabel} · {active.memberCount} members
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-zt-muted" />
        </>
      )}
    </span>
  );

  return (
    <div className={cn("px-3", collapsed && "px-2")}>
      <Dropdown
        trigger={trigger}
        align="start"
        className="w-full"
        menuClassName="w-72"
      >
        <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zt-muted">
          Workspaces
        </p>
        {workspace.workspaces.map((w) => (
          <button
            key={w.id}
            type="button"
            role="menuitem"
            onClick={() => switchTo(w.id)}
            className={cn(dropdownItemClass, "justify-between")}
          >
            <span className="min-w-0 truncate text-left">
              <span className="block truncate text-sm text-zt-text">{w.name}</span>
              <span className="block truncate text-[11px] text-zt-muted">
                {PLAN_LABELS[w.plan] ?? w.plan} · {w.projectCount} projects
              </span>
            </span>
            {w.id === active.id ? (
              <Check className="size-4 text-zt-primary" aria-hidden />
            ) : null}
          </button>
        ))}
        <div className="my-1 h-px bg-zt-border" />
        {creating ? (
          <div
            className="space-y-2 px-2 py-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workspace name"
              className="w-full rounded-lg border border-zt-border bg-zt-surface px-2.5 py-1.5 text-sm text-zt-text outline-none focus:border-zt-primary"
            />
            <button
              type="button"
              onClick={create}
              disabled={pending || !name.trim()}
              className="w-full rounded-lg bg-gradient-to-r from-zt-primary to-zt-purple px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Create workspace
            </button>
          </div>
        ) : (
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setCreating(true);
            }}
            className={dropdownItemClass}
          >
            <Plus className="size-4" aria-hidden />
            New workspace
          </button>
        )}
      </Dropdown>
    </div>
  );
}
