"use client";

import Link from "next/link";
import { useState } from "react";
import { Bug, KeyRound, Plus, Sparkles } from "lucide-react";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { Toast } from "@/components/dashboard/toast";
import { ProjectFormModal } from "@/features/projects/components/project-form-modal";
import { DASHBOARD_ROUTES } from "@/lib/constants";

const actionClass =
  "group relative flex items-center gap-3 overflow-hidden rounded-xl border border-zt-border bg-white/[0.02] px-4 py-3.5 text-sm font-medium text-zt-text transition-all duration-300 hover:-translate-y-0.5 hover:border-zt-border-strong hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zt-primary/50";

const iconWrap =
  "flex size-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110";

const glow =
  "pointer-events-none absolute -right-6 -top-6 size-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-60";

export function QuickActions() {
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Quick Actions</PanelTitle>
      </PanelHeader>
      <PanelContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={actionClass}
            onClick={() => setCreateOpen(true)}
          >
            <span className={`${glow} bg-zt-primary/40`} aria-hidden />
            <span className={`${iconWrap} bg-zt-primary/15 text-zt-primary`}>
              <Plus className="size-4" aria-hidden />
            </span>
            Create Project
          </button>
          <Link href={DASHBOARD_ROUTES.apiKeys} className={actionClass}>
            <span className={`${glow} bg-zt-accent/40`} aria-hidden />
            <span className={`${iconWrap} bg-zt-accent/15 text-zt-accent`}>
              <KeyRound className="size-4" aria-hidden />
            </span>
            Generate API Key
          </Link>
          <Link href={DASHBOARD_ROUTES.aiAssistant} className={actionClass}>
            <span className={`${glow} bg-zt-secondary/40`} aria-hidden />
            <span className={`${iconWrap} bg-zt-secondary/15 text-zt-secondary`}>
              <Sparkles className="size-4" aria-hidden />
            </span>
            Open AI Assistant
          </Link>
          <Link href={DASHBOARD_ROUTES.errors} className={actionClass}>
            <span className={`${glow} bg-zt-danger/40`} aria-hidden />
            <span className={`${iconWrap} bg-zt-danger/15 text-zt-danger`}>
              <Bug className="size-4" aria-hidden />
            </span>
            View Errors
          </Link>
        </div>
      </PanelContent>

      <ProjectFormModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(message) => setToast(message)}
      />

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </Panel>
  );
}
