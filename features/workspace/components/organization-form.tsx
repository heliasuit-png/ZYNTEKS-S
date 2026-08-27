"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import { useDictionary } from "@/components/i18n/locale-provider";
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
  const { dict } = useDictionary();
  const t = dict.dash.organization;
  const common = dict.dashboardCommon;

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
              <PanelTitle>{t.title}</PanelTitle>
              <PanelDescription>{t.desc}</PanelDescription>
            </div>
          </PanelHeader>
          <PanelContent>
            <form action={action} className="space-y-5" encType="multipart/form-data">
              <input type="hidden" name="workspaceId" value={workspace.id} />

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t.workspaceName}>
                  <input
                    name="name"
                    defaultValue={workspace.name}
                    required
                    disabled={!canManage}
                    className={inputClass}
                  />
                </Field>
                <Field label={t.workspaceSlug}>
                  <input
                    name="slug"
                    defaultValue={workspace.slug}
                    required
                    disabled={!canManage}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    title={t.slugPatternTitle}
                    className={inputClass}
                  />
                </Field>
                <Field label={t.logoUrl}>
                  <input
                    name="logoUrl"
                    defaultValue={workspace.logo_url ?? ""}
                    placeholder="https://…"
                    disabled={!canManage}
                    className={inputClass}
                  />
                </Field>
                <Field label={t.logoUpload}>
                  <input
                    type="file"
                    name="logoFile"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={!canManage}
                    className="block w-full text-xs text-zt-muted file:mr-3 file:rounded-lg file:border-0 file:bg-zt-primary/15 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zt-primary"
                  />
                </Field>
                <Field label={t.brandColor}>
                  <input
                    name="brandColor"
                    type="color"
                    defaultValue={workspace.brand_color || "#00E5FF"}
                    disabled={!canManage}
                    className="h-10 w-full cursor-pointer rounded-xl border border-zt-border bg-transparent px-2"
                  />
                </Field>
                <Field label={t.timezone}>
                  <input
                    name="timezone"
                    defaultValue={workspace.timezone}
                    disabled={!canManage}
                    className={inputClass}
                  />
                </Field>
                <Field label={t.sessionTimeout}>
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
                    {t.workspaceUrl}
                  </span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <code className="min-w-0 flex-1 truncate rounded-xl border border-zt-border bg-white/[0.02] px-3 py-2 text-sm text-zt-text">
                      {workspaceUrl}
                    </code>
                    <CopyButton value={workspaceUrl} label={t.copyUrl} />
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
                  {t.notifyEmail}
                </label>
                <label className="flex items-center gap-2 text-sm text-zt-text">
                  <input
                    type="checkbox"
                    name="notifyDashboard"
                    defaultChecked={notifications.dashboard !== false}
                    disabled={!canManage}
                  />
                  {t.notifyDashboard}
                </label>
                <label className="flex items-center gap-2 text-sm text-zt-text md:col-span-2">
                  <input
                    type="checkbox"
                    name="require2fa"
                    defaultChecked={Boolean(security.require_2fa)}
                    disabled={!canManage}
                  />
                  {t.require2fa}
                </label>
              </div>

              {canManage ? (
                <Button type="submit" disabled={pending}>
                  {pending ? common.saving : t.save}
                </Button>
              ) : (
                <p className="text-xs text-zt-muted">{t.needAdmin}</p>
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
            <PanelTitle>{t.transferOwnership}</PanelTitle>
            <PanelDescription>{t.transferOwnershipDesc}</PanelDescription>
          </PanelHeader>
          <PanelContent>
            <Link
              href={DASHBOARD_ROUTES.members}
              className="inline-flex rounded-lg border border-zt-border px-3 py-2 text-sm text-zt-muted transition-colors hover:text-zt-text"
            >
              {t.openMembers}
            </Link>
          </PanelContent>
        </Panel>
      </FadeIn>

      {canDelete ? (
        <FadeIn delay={0.08}>
          <Panel className="border-zt-danger/30">
            <PanelHeader>
              <PanelTitle>{t.deleteWorkspace}</PanelTitle>
              <PanelDescription>
                {t.deleteWorkspaceDesc} {t.deleteWorkspaceHint}
                {workspaceCount <= 1 ? ` ${t.onlyWorkspaceWarning}` : null}
              </PanelDescription>
            </PanelHeader>
            <PanelContent>
              <form action={deleteAction} className="space-y-3">
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <Field label={t.confirmName}>
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
                  {deletePending ? t.deleting : t.deleteWorkspaceConfirm}
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
