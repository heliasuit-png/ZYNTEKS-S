"use client";

import { useDictionary } from "@/components/i18n/locale-provider";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { hasAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import type { AdminUserDetail } from "@/services/admin/users.types";
import {
  deleteUserAction,
  demoteUserAction,
  forceLogoutAction,
  forcePasswordResetAction,
  loadUserDetailAction,
  promoteUserAction,
  reactivateUserAction,
  suspendUserAction,
  transferWorkspaceAction,
} from "@/features/admin/users-actions";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface UserDrawerProps {
  userId: string | null;
  role: AdminPlatformRole;
  onClose: () => void;
}

export function UserDrawer({ userId, role, onClose }: UserDrawerProps) {
  const { dict } = useDictionary();
  const t = dict.admin.users.drawer;
  const common = dict.admin.common;
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [transferOwnerId, setTransferOwnerId] = useState("");

  useEffect(() => {
    if (!userId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const data = await loadUserDetailAction(userId);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t.loadFailed);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId, t.loadFailed]);

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);
      if (result.ok && userId) {
        try {
          setDetail(await loadUserDetailAction(userId));
        } catch {
          /* keep previous detail */
        }
      }
      if (result.ok && result.message.includes("deleted")) {
        onClose();
      }
    });
  }

  const canWrite = hasAdminPermission(role, "admin:users:write");
  const canReset = hasAdminPermission(role, "admin:users:reset_password");
  const canDelete = hasAdminPermission(role, "admin:platform:delete");
  const canTransfer = hasAdminPermission(role, "admin:workspaces:write");

  return (
    <AnimatePresence>
      {userId ? (
        <>
          <motion.button
            type="button"
            aria-label={t.closeAria}
            className="fixed inset-0 z-40 bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t.profileAria}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="admin-glass fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-[var(--admin-border)] bg-[rgba(8,12,20,0.96)]"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                  {detail?.profile.fullName ||
                    detail?.profile.email ||
                    common.userFallback}
                </h2>
                <p className="text-xs text-[var(--admin-muted)]">
                  {detail?.profile.email}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[var(--admin-border)] px-2 py-1 text-xs text-[var(--admin-muted)]"
              >
                {common.close}
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {pending && !detail ? (
                <DrawerSkeleton />
              ) : error ? (
                <p className="text-sm text-rose-300">{error}</p>
              ) : detail ? (
                <>
                  {message ? (
                    <p className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-xs text-[var(--admin-accent)]">
                      {message}
                    </p>
                  ) : null}

                  <Section title={t.profile}>
                    <Grid
                      rows={[
                        [
                          t.fields.avatar,
                          detail.profile.avatarUrl ? t.set : common.none,
                        ],
                        [t.fields.email, detail.profile.email],
                        [t.fields.phone, t.notCollected],
                        [t.fields.country, detail.profile.country ?? "—"],
                        [t.fields.timezone, detail.timezone],
                        [t.fields.language, detail.language],
                        [t.fields.plan, detail.subscriptionPlan],
                        [t.fields.status, detail.profile.status],
                        [
                          t.fields.verified,
                          detail.profile.verified == null
                            ? "—"
                            : detail.profile.verified
                              ? common.yes
                              : common.no,
                        ],
                        [t.fields.role, detail.profile.displayRole],
                        [
                          t.fields.authProviders,
                          detail.profile.authProviders.join(", "),
                        ],
                        [
                          t.fields.mfa,
                          detail.profile.mfaEnabled ? t.enabled : t.notEnabled,
                        ],
                        [
                          t.fields.lastLogin,
                          detail.profile.lastLoginAt
                            ? formatWhen(detail.profile.lastLoginAt)
                            : "—",
                        ],
                      ]}
                    />
                  </Section>

                  <Section title={t.actions}>
                    <div className="flex flex-wrap gap-2">
                      {canWrite ? (
                        <>
                          <ActionButton
                            label={t.promote}
                            disabled={pending}
                            onClick={() =>
                              run(() => promoteUserAction(detail.profile.id))
                            }
                          />
                          <ActionButton
                            label={t.demote}
                            disabled={pending || !detail.profile.platformRole}
                            onClick={() =>
                              run(() => demoteUserAction(detail.profile.id))
                            }
                          />
                          <ActionButton
                            label={t.suspend}
                            disabled={pending || detail.profile.status === "banned"}
                            onClick={() =>
                              run(() => suspendUserAction(detail.profile.id))
                            }
                          />
                          <ActionButton
                            label={t.reactivate}
                            disabled={pending || detail.profile.status === "active"}
                            onClick={() =>
                              run(() => reactivateUserAction(detail.profile.id))
                            }
                          />
                          <ActionButton
                            label={t.forceLogout}
                            disabled={pending}
                            onClick={() =>
                              run(() => forceLogoutAction(detail.profile.id))
                            }
                          />
                        </>
                      ) : null}
                      {canReset ? (
                        <ActionButton
                          label={t.resetPassword}
                          disabled={pending}
                          onClick={() =>
                            run(() => forcePasswordResetAction(detail.profile.id))
                          }
                        />
                      ) : null}
                      {canDelete ? (
                        <ActionButton
                          label={t.deleteUser}
                          danger
                          disabled={pending}
                          onClick={() => {
                            if (
                              window.confirm(
                                fillTemplate(t.deleteConfirm, {
                                  email: detail.profile.email,
                                }),
                              )
                            ) {
                              run(() => deleteUserAction(detail.profile.id));
                            }
                          }}
                        />
                      ) : null}
                    </div>

                    {canTransfer && detail.ownedWorkspaces.length > 0 ? (
                      <div className="mt-3 space-y-2 rounded-xl border border-[var(--admin-border)] p-3">
                        <p className="text-xs text-[var(--admin-muted)]">
                          {t.transferHint}
                        </p>
                        <select
                          className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
                          defaultValue={detail.ownedWorkspaces[0]?.id}
                          id="transfer-workspace"
                        >
                          {detail.ownedWorkspaces.map((ws) => (
                            <option key={ws.id} value={ws.id}>
                              {ws.name}
                            </option>
                          ))}
                        </select>
                        <input
                          value={transferOwnerId}
                          onChange={(e) => setTransferOwnerId(e.target.value)}
                          placeholder={t.transferPlaceholder}
                          className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
                        />
                        <ActionButton
                          label={t.transferWorkspace}
                          disabled={pending || !transferOwnerId.trim()}
                          onClick={() => {
                            const select = document.getElementById(
                              "transfer-workspace",
                            ) as HTMLSelectElement | null;
                            const workspaceId = select?.value;
                            if (!workspaceId) return;
                            run(() =>
                              transferWorkspaceAction(
                                workspaceId,
                                transferOwnerId.trim(),
                              ),
                            );
                          }}
                        />
                      </div>
                    ) : null}
                  </Section>

                  <Section title={t.security}>
                    <Grid
                      rows={[
                        [
                          t.fields.failedLogins24h,
                          String(detail.security.failedLogins24h),
                        ],
                        [
                          t.fields.apiKeyAuthFailures24h,
                          String(detail.security.failedApiKeyAuth24h),
                        ],
                        [
                          t.fields.activeSessions,
                          String(detail.security.activeSessions),
                        ],
                        [t.fields.blockedRequests, t.notes.blocked],
                        [
                          t.fields.suspiciousActivity,
                          detail.security.suspiciousLoginCount > 0
                            ? fillTemplate(t.notes.suspiciousCount, {
                                count: detail.security.suspiciousLoginCount,
                              })
                            : t.notes.suspiciousNone,
                        ],
                      ]}
                    />
                    <ul className="mt-2 space-y-1">
                      {detail.security.newestFailures.map((item) => (
                        <li
                          key={item.id}
                          className="text-xs text-[var(--admin-muted)]"
                        >
                          {item.detail} · {formatWhen(item.occurredAt)}
                        </li>
                      ))}
                    </ul>
                  </Section>

                  <Section title={t.loginHistory}>
                    {detail.loginHistory.length === 0 ? (
                      <p className="text-xs text-[var(--admin-muted)]">
                        {t.noLoginHistory}
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {detail.loginHistory.slice(0, 20).map((event) => (
                          <li
                            key={event.id}
                            className="text-xs text-[var(--admin-muted)]"
                          >
                            <span className="text-[var(--admin-text)]">
                              {event.method}
                            </span>
                            {event.provider ? ` · ${event.provider}` : ""} ·{" "}
                            {event.result}
                            {event.isSuspicious
                              ? ` · ${common.suspicious}`
                              : ""}{" "}
                            · {event.deviceLabel ?? "—"} ·{" "}
                            {event.country ?? "—"} · {event.ipAddress ?? "—"} ·{" "}
                            {formatWhen(event.createdAt)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  <Section title={t.subscriptionProjects}>
                    <p className="text-xs text-[var(--admin-muted)]">
                      {fillTemplate(t.planProjects, {
                        plan: detail.subscriptionPlan,
                        count: detail.projects.length,
                      })}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {detail.projects.map((project) => (
                        <li
                          key={project.id}
                          className="text-xs text-[var(--admin-text)]"
                        >
                          {project.name}{" "}
                          <span className="text-[var(--admin-muted)]">
                            ({project.status})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Section>

                  <Section title={t.apiKeys}>
                    <ul className="space-y-1">
                      {detail.apiKeys.length === 0 ? (
                        <li className="text-xs text-[var(--admin-muted)]">
                          {t.noApiKeys}
                        </li>
                      ) : (
                        detail.apiKeys.map((key) => (
                          <li
                            key={key.id}
                            className="text-xs text-[var(--admin-text)]"
                          >
                            {key.name} · {key.keyPrefix}… · {key.status}
                          </li>
                        ))
                      )}
                    </ul>
                  </Section>

                  <Section title={t.aiUsage}>
                    <p className="text-xs text-[var(--admin-muted)]">
                      {fillTemplate(t.aiUsageSummary, {
                        requests: detail.aiUsage.requests.toLocaleString(),
                        tokens: detail.aiUsage.tokens.toLocaleString(),
                      })}
                    </p>
                  </Section>

                  <Section title={t.recentErrors}>
                    <List
                      empty={t.noRecentErrors}
                      items={detail.recentErrors.map((item) => ({
                        id: item.id,
                        title: item.message,
                        meta: `${item.level} · ${formatWhen(item.lastSeen)}`,
                      }))}
                    />
                  </Section>

                  <Section title={t.recentIncidents}>
                    <List
                      empty={t.noRecentIncidents}
                      items={detail.recentIncidents.map((item) => ({
                        id: item.id,
                        title: item.title,
                        meta: `${item.status} · ${item.severity}`,
                      }))}
                    />
                  </Section>

                  <Section title={t.sessionsDevices}>
                    <ul className="space-y-2">
                      {detail.sessions.map((session) => (
                        <li
                          key={session.id}
                          className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-xs"
                        >
                          <p className="text-[var(--admin-text)]">
                            {session.deviceLabel ?? t.unknownDevice}
                            {session.isCurrent ? ` · ${common.current}` : ""}
                            {session.revokedAt ? ` · ${common.revoked}` : ""}
                          </p>
                          <p className="text-[var(--admin-muted)]">
                            {[session.browser, session.os, session.country]
                              .filter(Boolean)
                              .join(" · ")}{" "}
                            · {formatWhen(session.lastActiveAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Section>

                  <Section title={t.activityTimeline}>
                    <List
                      empty={t.noActivity}
                      items={detail.activity.map((item) => ({
                        id: item.id,
                        title: item.title,
                        meta: `${item.detail} · ${formatWhen(item.occurredAt)}`,
                      }))}
                    />
                  </Section>
                </>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Grid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[var(--admin-muted)]">{label}</dt>
          <dd className="text-[var(--admin-text)]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function List({
  items,
  empty,
}: {
  items: { id: string; title: string; meta: string }[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-[var(--admin-muted)]">{empty}</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id} className="text-xs">
          <p className="text-[var(--admin-text)]">{item.title}</p>
          <p className="text-[var(--admin-muted)]">{item.meta}</p>
        </li>
      ))}
    </ul>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-xs disabled:opacity-40 ${
        danger
          ? "border-rose-400/40 text-rose-300"
          : "border-[var(--admin-border)] text-[var(--admin-text)] hover:border-[var(--admin-border-strong)]"
      }`}
    >
      {label}
    </button>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl bg-[var(--admin-surface)]"
        />
      ))}
    </div>
  );
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
