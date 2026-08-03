"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/dashboard/button";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelDescription,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import { CopyButton } from "@/components/dashboard/copy-button";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import {
  deleteWorkspaceAction,
  updateOrganizationAction,
  type ActionState,
} from "@/features/workspace/actions";
import type { Workspace } from "@/services/workspace/workspace.service";
import type { Json } from "@/types/database";

const inputClass =
  "w-full rounded-xl border border-zt-border bg-white/[0.02] px-3 py-2 text-sm text-zt-text outline-none focus:border-zt-primary disabled:opacity-60";

function asRecord(value: Json): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function OrganizationForm({
  workspace,
  canManage,
  canDelete,
  workspaceUrl,
  workspaceCount,
}: {
  workspace: Workspace;
  canManage: boolean;
  canDelete: boolean;
  workspaceUrl: string;
  workspaceCount: number;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateOrganizationAction,
    { ok: false },
  );
  const [deleteState, deleteAction, deletePending] = useActionState<
    ActionState,
    FormData
  >(deleteWorkspaceAction, { ok: false });

  const notifications = asRecord(workspace.notification_defaults);
  const security = asRecord(workspace.security_policies);

  return (
    <div className="space-y-6">
      <FadeIn>
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Organization settings</PanelTitle>
              <PanelDescription>
                Workspace name, logo, brand color, timezone, URL and security
                policies.
              </PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent>
            <form action={action} className="space-y-5" encType="multipart/form-data">
              <input type="hidden" name="workspaceId" value={workspace.id} />

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Workspace name">
                  <input
                    name="name"
                    defaultValue={workspace.name}
                    required
                    disabled={!canManage}
                    className={inputClass}
                  />
                </Field>
                <Field label="Workspace URL slug">
                  <input
                    name="slug"
                    defaultValue={workspace.slug}
                    required
                    disabled={!canManage}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    title="Lowercase letters, numbers and hyphens"
                    className={inputClass}
                  />
                </Field>
                <Field label="Logo URL">
                  <input
                    name="logoUrl"
                    defaultValue={workspace.logo_url ?? ""}
                    placeholder="https://…"
                    disabled={!canManage}
                    className={inputClass}
                  />
                </Field>
                <Field label="Logo upload">
                  <input
                    type="file"
                    name="logoFile"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={!canManage}
                    className="block w-full text-xs text-zt-muted file:mr-3 file:rounded-lg file:border-0 file:bg-zt-primary/15 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zt-primary"
                  />
                </Field>
                <Field label="Brand color">
                  <input
                    name="brandColor"
                    type="color"
                    defaultValue={workspace.brand_color || "#00E5FF"}
                    disabled={!canManage}
                    className="h-10 w-full cursor-pointer rounded-xl border border-zt-border bg-transparent px-2"
                  />
                </Field>
                <Field label="Timezone">
                  <input
                    name="timezone"
                    defaultValue={workspace.timezone}
                    disabled={!canManage}
                    className={inputClass}
                  />
                </Field>
                <Field label="Session timeout (hours)">
                  <input
                    name="sessionTimeout"
                    type="number"
                    min={1}
                    defaultValue={Number(security.session_timeout_hours ?? 720)}
                    disabled={!canManage}
                    className={inputClass}
                  />
                </Field>
                <div className="space-y-1.5 md:col-span-2">
                  <span className="text-xs font-medium text-zt-muted">
                    Workspace URL
                  </span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <code className="min-w-0 flex-1 truncate rounded-xl border border-zt-border bg-white/[0.02] px-3 py-2 text-sm text-zt-text">
                      {workspaceUrl}
                    </code>
                    <CopyButton value={workspaceUrl} label="Copy URL" />
                  </div>
                </div>
              </div>

              {workspace.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={workspace.logo_url}
                  alt={`${workspace.name} logo`}
                  className="size-16 rounded-xl border border-zt-border object-cover"
                />
              ) : null}

              <div className="grid gap-3 rounded-xl border border-zt-border bg-white/[0.015] p-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-zt-text">
                  <input
                    type="checkbox"
                    name="notifyEmail"
                    defaultChecked={notifications.email !== false}
                    disabled={!canManage}
                  />
                  Email notification defaults
                </label>
                <label className="flex items-center gap-2 text-sm text-zt-text">
                  <input
                    type="checkbox"
                    name="notifyDashboard"
                    defaultChecked={notifications.dashboard !== false}
                    disabled={!canManage}
                  />
                  Dashboard notification defaults
                </label>
                <label className="flex items-center gap-2 text-sm text-zt-text md:col-span-2">
                  <input
                    type="checkbox"
                    name="require2fa"
                    defaultChecked={Boolean(security.require_2fa)}
                    disabled={!canManage}
                  />
                  Require two-factor authentication (security policy)
                </label>
              </div>

              {canManage ? (
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save organization settings"}
                </Button>
              ) : (
                <p className="text-xs text-zt-muted">
                  You need administrator access to edit organization settings.
                </p>
              )}

              {state.error ? (
                <p className="text-xs text-zt-danger">{state.error}</p>
              ) : null}
              {state.ok ? (
                <p className="text-xs text-zt-success">{state.message}</p>
              ) : null}
            </form>
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.04}>
        <Panel>
          <PanelHeader>
            <PanelTitle>Transfer ownership</PanelTitle>
            <PanelDescription>
              Ownership transfer is available from the Team members page. Only the
              current owner can transfer the workspace.
            </PanelDescription>
          </PanelHeader>
          <PanelContent>
            <Link
              href={DASHBOARD_ROUTES.members}
              className="inline-flex rounded-lg border border-zt-border px-3 py-2 text-sm text-zt-muted transition-colors hover:text-zt-text"
            >
              Open team members
            </Link>
          </PanelContent>
        </Panel>
      </FadeIn>

      {canDelete ? (
        <FadeIn delay={0.08}>
          <Panel className="border-zt-danger/30">
            <PanelHeader>
              <PanelTitle>Delete workspace</PanelTitle>
              <PanelDescription>
                Permanently delete this workspace and its projects. Type the
                workspace name to confirm.
                {workspaceCount <= 1
                  ? " You must create another workspace before deleting your only one."
                  : null}
              </PanelDescription>
            </PanelHeader>
            <PanelContent>
              <form action={deleteAction} className="space-y-3">
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <Field label="Confirm workspace name">
                  <input
                    name="confirmationName"
                    required
                    placeholder={workspace.name}
                    disabled={workspaceCount <= 1}
                    className={inputClass}
                  />
                </Field>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={deletePending || workspaceCount <= 1}
                >
                  {deletePending ? "Deleting…" : "Delete workspace"}
                </Button>
                {deleteState.error ? (
                  <p className="text-xs text-zt-danger">{deleteState.error}</p>
                ) : null}
                {deleteState.ok ? (
                  <p className="text-xs text-zt-success">{deleteState.message}</p>
                ) : null}
              </form>
            </PanelContent>
          </Panel>
        </FadeIn>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zt-muted">{label}</span>
      {children}
    </label>
  );
}
