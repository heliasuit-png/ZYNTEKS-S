"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Mail,
  MoreHorizontal,
  Shield,
  UserMinus,
  UserX,
  Crown,
  UserCheck,
} from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/dashboard/badge";
import { Button } from "@/components/dashboard/button";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import { formatRelativeTime } from "@/utils/format";
import { fillTemplate } from "@/lib/i18n/fill-template";
import {
  cancelInvitationAction,
  changeRoleAction,
  inviteMemberAction,
  removeMemberAction,
  resendInvitationAction,
  restoreMemberAction,
  suspendMemberAction,
  transferOwnershipAction,
  type ActionState,
} from "@/features/workspace/actions";
import {
  ASSIGNABLE_ROLES,
  permissionsForRole,
} from "@/services/workspace/permissions";
import type { MemberCard } from "@/services/workspace/members.service";
import type { Invitation } from "@/services/workspace/invitations.service";
import type { WorkspaceRole } from "@/types/database";
import {
  Dropdown,
  dropdownItemClass,
} from "@/components/dashboard/dropdown";
import type { DashDictionary } from "@/lib/i18n/dictionaries/dash-types";

function permissionSummaryForRole(
  role: string,
  summary: DashDictionary["members"]["permissionSummary"],
): string | null {
  if (role in summary) {
    return summary[role as keyof typeof summary];
  }
  return null;
}

function roleLabel(
  role: WorkspaceRole,
  roles: DashDictionary["members"]["roles"],
): string {
  return roles[role] ?? role;
}

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function MembersView({
  workspaceId,
  members,
  invitations,
  canManage,
  currentUserId,
}: {
  workspaceId: string;
  members: MemberCard[];
  invitations: Invitation[];
  canManage: boolean;
  currentUserId: string;
}) {
  const { dict, locale } = useDictionary();
  const t = dict.dash.members;

  const [inviteState, inviteAction, invitePending] = useActionState<
    ActionState,
    FormData
  >(inviteMemberAction, { ok: false });
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {canManage ? (
        <FadeIn>
          <Panel>
            <PanelHeader>
              <PanelTitle>{t.inviteTitle}</PanelTitle>
            </PanelHeader>
            <PanelContent>
              <form action={inviteAction} className="flex flex-col gap-3 sm:flex-row">
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={t.invitePlaceholder}
                  className="flex-1 rounded-xl border border-zt-border bg-white/[0.02] px-3 py-2 text-sm text-zt-text outline-none focus:border-zt-primary"
                />
                <select
                  name="role"
                  defaultValue="developer"
                  className="rounded-xl border border-zt-border bg-white/[0.02] px-3 py-2 text-sm text-zt-text"
                >
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role, t.roles)}
                    </option>
                  ))}
                </select>
                <Button type="submit" disabled={invitePending}>
                  <Mail className="size-4" aria-hidden />
                  {t.invite}
                </Button>
              </form>
              {inviteState.error ? (
                <p className="mt-2 text-xs text-zt-danger">{inviteState.error}</p>
              ) : null}
              {inviteState.ok ? (
                <p className="mt-2 text-xs text-zt-success">{inviteState.message}</p>
              ) : null}
            </PanelContent>
          </Panel>
        </FadeIn>
      ) : null}

      <FadeIn delay={0.05}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => {
            const summary =
              permissionSummaryForRole(member.role, t.permissionSummary) ??
              fillTemplate(t.grantsCount, {
                count: permissionsForRole(member.role).length,
              });
            const statusLabel =
              member.status === "suspended"
                ? t.status.suspended
                : t.status.active;

            return (
              <article
                key={member.id}
                className="zt-card rounded-2xl border border-zt-border p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-zt-primary to-zt-purple text-sm font-semibold text-white shadow-lg shadow-zt-primary/20">
                      {initials(member.fullName, member.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zt-text">
                        {member.fullName || member.email}
                      </p>
                      <p className="truncate text-xs text-zt-muted">{member.email}</p>
                    </div>
                  </div>
                  {canManage && member.userId !== currentUserId ? (
                    <MemberMenu
                      workspaceId={workspaceId}
                      member={member}
                      pending={pending}
                      startTransition={startTransition}
                    />
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      member.role === "owner"
                        ? "primary"
                        : member.status === "suspended"
                          ? "danger"
                          : "default"
                    }
                  >
                    <Shield className="size-3" aria-hidden />
                    {roleLabel(member.role, t.roles)}
                  </Badge>
                  <Badge
                    tone={member.status === "active" ? "success" : "warning"}
                  >
                    {statusLabel}
                  </Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-zt-muted">{t.lastActive}</dt>
                    <dd className="mt-0.5 text-zt-text">
                      {member.lastActiveAt
                        ? formatRelativeTime(member.lastActiveAt, undefined, locale)
                        : t.never}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zt-muted">{t.projects}</dt>
                    <dd className="mt-0.5 text-zt-text">{member.projectCount}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-zt-muted">
                  {t.permissions}:{" "}
                  <span className="text-zt-text">{summary}</span>
                </p>
              </article>
            );
          })}
        </div>
      </FadeIn>

      {invitations.filter((i) => i.status === "pending").length > 0 ? (
        <FadeIn delay={0.1}>
          <Panel>
            <PanelHeader>
              <PanelTitle>{t.pendingInvitations}</PanelTitle>
            </PanelHeader>
            <PanelContent className="space-y-2">
              {invitations
                .filter((i) => i.status === "pending")
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col gap-2 rounded-xl border border-zt-border bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm text-zt-text">{inv.email}</p>
                      <p className="text-xs text-zt-muted">
                        {roleLabel(inv.role, t.roles)} ·{" "}
                        {t.expires.replace(
                          "{rel}",
                          formatRelativeTime(inv.expires_at, undefined, locale),
                        )}
                      </p>
                    </div>
                    {canManage ? (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await resendInvitationAction(workspaceId, inv.id);
                            })
                          }
                        >
                          {t.resend}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await cancelInvitationAction(workspaceId, inv.id);
                            })
                          }
                        >
                          {t.cancelInvite}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
            </PanelContent>
          </Panel>
        </FadeIn>
      ) : null}
    </div>
  );
}

function MemberMenu({
  workspaceId,
  member,
  pending,
  startTransition,
}: {
  workspaceId: string;
  member: MemberCard;
  pending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.members;
  const org = dict.dash.organization;
  const [role, setRole] = useState<WorkspaceRole>(
    member.role === "owner" ? "administrator" : member.role,
  );

  return (
    <Dropdown
      align="end"
      trigger={
        <span className="flex size-8 items-center justify-center rounded-lg border border-zt-border text-zt-muted hover:text-zt-text">
          <MoreHorizontal className="size-4" aria-hidden />
        </span>
      }
    >
      <div
        className="space-y-1 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="block px-2 pt-1 text-[11px] text-zt-muted">
          {t.changeRole}
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as WorkspaceRole)}
          className="mx-2 mb-1 w-[calc(100%-1rem)] rounded-lg border border-zt-border bg-zt-surface px-2 py-1.5 text-xs"
          disabled={member.role === "owner"}
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r, t.roles)}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || member.role === "owner"}
          className={dropdownItemClass}
          onClick={() =>
            startTransition(() => {
              void changeRoleAction(workspaceId, member.id, role);
            })
          }
        >
          <Shield className="size-4" aria-hidden />
          {t.saveRole}
        </button>
        {member.status === "active" ? (
          <button
            type="button"
            disabled={pending || member.role === "owner"}
            className={dropdownItemClass}
            onClick={() =>
              startTransition(() => {
                void suspendMemberAction(workspaceId, member.id);
              })
            }
          >
            <UserX className="size-4" aria-hidden />
            {t.suspend}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            className={dropdownItemClass}
            onClick={() =>
              startTransition(() => {
                void restoreMemberAction(workspaceId, member.id);
              })
            }
          >
            <UserCheck className="size-4" aria-hidden />
            {t.restore}
          </button>
        )}
        <button
          type="button"
          disabled={pending || member.role === "owner"}
          className={dropdownItemClass}
          onClick={() =>
            startTransition(() => {
              void removeMemberAction(workspaceId, member.id);
            })
          }
        >
          <UserMinus className="size-4" aria-hidden />
          {t.remove}
        </button>
        <button
          type="button"
          disabled={pending || member.role === "owner" || member.status !== "active"}
          className={dropdownItemClass}
          onClick={() =>
            startTransition(() => {
              void transferOwnershipAction(workspaceId, member.id);
            })
          }
        >
          <Crown className="size-4" aria-hidden />
          {org.transferOwnership}
        </button>
      </div>
    </Dropdown>
  );
}
