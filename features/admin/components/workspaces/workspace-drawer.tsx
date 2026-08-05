"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { hasAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import type { AdminWorkspaceDetail } from "@/services/admin/workspaces.types";
import {
  deleteWorkspaceAction,
  demoteMemberAction,
  loadWorkspaceDetailAction,
  promoteMemberAction,
  removeMemberAction,
  renameWorkspaceAction,
  setWorkspaceStatusAction,
  transferWorkspaceOwnerAction,
} from "@/features/admin/workspaces-actions";
import { formatNumber, formatWhen } from "@/features/admin/components/executive/format";

interface WorkspaceDrawerProps {
  workspaceId: string | null;
  role: AdminPlatformRole;
  onClose: () => void;
}

export function WorkspaceDrawer({
  workspaceId,
  role,
  onClose,
}: WorkspaceDrawerProps) {
  const [detail, setDetail] = useState<AdminWorkspaceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [renameValue, setRenameValue] = useState("");
  const [transferUserId, setTransferUserId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (!workspaceId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const data = await loadWorkspaceDetailAction(workspaceId);
        if (!cancelled) {
          setDetail(data);
          setRenameValue(data.workspace.name);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load workspace",
          );
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);
      if (result.ok && workspaceId) {
        if (result.message.includes("deleted")) {
          onClose();
          return;
        }
        try {
          setDetail(await loadWorkspaceDetailAction(workspaceId));
        } catch {
          /* keep previous */
        }
      }
    });
  }

  const canWrite = hasAdminPermission(role, "admin:workspaces:write");
  const canDelete = hasAdminPermission(role, "admin:platform:delete");

  return (
    <AnimatePresence>
      {workspaceId ? (
        <>
          <motion.button
            type="button"
            aria-label="Close workspace drawer"
            className="fixed inset-0 z-40 bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Workspace detail"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="admin-glass fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-[var(--admin-border)] bg-[rgba(8,12,20,0.96)]"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold"
                  style={{
                    background: `${detail?.workspace.brandColor ?? "#64748b"}33`,
                    color: detail?.workspace.brandColor ?? "#94a3b8",
                  }}
                >
                  {detail?.workspace.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={detail.workspace.logoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    detail?.workspace.name[0]?.toUpperCase() ?? "W"
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                    {detail?.workspace.name ?? "Workspace"}
                  </h2>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {detail?.workspace.slug}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[var(--admin-border)] px-2 py-1 text-xs text-[var(--admin-muted)]"
              >
                Close
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

                  <Section title="Overview">
                    <Grid
                      rows={[
                        ["Brand color", detail.workspace.brandColor],
                        [
                          "Owner",
                          detail.workspace.ownerName
                            ? `${detail.workspace.ownerName} · ${detail.workspace.ownerEmail}`
                            : detail.workspace.ownerEmail,
                        ],
                        ["Members", String(detail.workspace.memberCount)],
                        ["Projects", String(detail.workspace.projectCount)],
                        ["API Keys", String(detail.workspace.apiKeyCount)],
                        [
                          "Health score",
                          detail.healthScore == null
                            ? "—"
                            : `${detail.healthScore}`,
                        ],
                        ["Errors (30d)", String(detail.workspace.errorCount30d)],
                        [
                          "Incidents (30d)",
                          String(detail.workspace.incidentCount30d),
                        ],
                        [
                          "Notifications (30d)",
                          String(detail.notificationCount30d),
                        ],
                        [
                          "Storage (logos)",
                          formatBytes(detail.workspace.storageBytes),
                        ],
                        [
                          "AI usage",
                          `${formatNumber(detail.aiUsage.requests)} req · ${formatNumber(detail.aiUsage.tokens)} tokens`,
                        ],
                        ["Heartbeat", detail.heartbeatStatus],
                        [
                          "Last heartbeat",
                          detail.lastHeartbeatAt
                            ? formatWhen(detail.lastHeartbeatAt)
                            : "—",
                        ],
                        ["Plan", detail.workspace.plan],
                        ["Status", detail.workspace.status],
                        ["Timezone", detail.timezone],
                      ]}
                    />
                  </Section>

                  <Section title="Health">
                    <MiniBars
                      title="Error trend (14d)"
                      points={detail.errorTrend}
                      color="#f87171"
                    />
                    <MiniBars
                      title="Incident trend (14d)"
                      points={detail.incidentTrend}
                      color="#fbbf24"
                    />
                    <MiniBars
                      title="API requests (14d)"
                      points={detail.apiRequestTrend}
                      color="#60a5fa"
                    />
                  </Section>

                  <Section title="Analytics">
                    <WorkspaceAnalyticsChart points={detail.analytics} />
                  </Section>

                  {canWrite ? (
                    <Section title="Workspace actions">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton
                          label="Suspend"
                          disabled={
                            pending || detail.workspace.status === "suspended"
                          }
                          onClick={() =>
                            run(() =>
                              setWorkspaceStatusAction(
                                detail.workspace.id,
                                "suspended",
                              ),
                            )
                          }
                        />
                        <ActionButton
                          label="Reactivate"
                          disabled={
                            pending || detail.workspace.status === "active"
                          }
                          onClick={() =>
                            run(() =>
                              setWorkspaceStatusAction(
                                detail.workspace.id,
                                "active",
                              ),
                            )
                          }
                        />
                        <ActionButton
                          label="Archive"
                          disabled={
                            pending || detail.workspace.status === "archived"
                          }
                          onClick={() =>
                            run(() =>
                              setWorkspaceStatusAction(
                                detail.workspace.id,
                                "archived",
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
                          aria-label="Rename workspace"
                        />
                        <ActionButton
                          label="Rename"
                          disabled={pending || !renameValue.trim()}
                          onClick={() =>
                            run(() =>
                              renameWorkspaceAction(
                                detail.workspace.id,
                                renameValue,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <select
                          value={transferUserId}
                          onChange={(e) => setTransferUserId(e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
                          aria-label="Transfer ownership to member"
                        >
                          <option value="">Transfer ownership to…</option>
                          {detail.members
                            .filter(
                              (m) => m.userId !== detail.workspace.ownerId,
                            )
                            .map((member) => (
                              <option key={member.id} value={member.userId}>
                                {member.fullName || member.email} ({member.role})
                              </option>
                            ))}
                        </select>
                        <ActionButton
                          label="Transfer"
                          disabled={pending || !transferUserId}
                          onClick={() =>
                            run(() =>
                              transferWorkspaceOwnerAction(
                                detail.workspace.id,
                                transferUserId,
                              ),
                            )
                          }
                        />
                      </div>
                      {canDelete ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <input
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder="Type workspace name to delete"
                            className="min-w-0 flex-1 rounded-lg border border-rose-500/40 bg-[var(--admin-surface)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
                            aria-label="Confirm delete workspace"
                          />
                          <ActionButton
                            label="Delete"
                            danger
                            disabled={
                              pending ||
                              deleteConfirm !== detail.workspace.name
                            }
                            onClick={() =>
                              run(() =>
                                deleteWorkspaceAction(
                                  detail.workspace.id,
                                  deleteConfirm,
                                ),
                              )
                            }
                          />
                        </div>
                      ) : null}
                    </Section>
                  ) : null}

                  <Section title="Members">
                    <div className="space-y-2">
                      {detail.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--admin-border)]/70 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm text-[var(--admin-text)]">
                              {member.fullName || member.email}
                            </p>
                            <p className="text-[10px] text-[var(--admin-muted)]">
                              {member.email} · {member.role} · {member.status}
                            </p>
                          </div>
                          {canWrite &&
                          member.userId !== detail.workspace.ownerId ? (
                            <div className="flex flex-wrap gap-1">
                              <ActionButton
                                label="Promote"
                                disabled={pending}
                                onClick={() =>
                                  run(() =>
                                    promoteMemberAction(
                                      detail.workspace.id,
                                      member.userId,
                                    ),
                                  )
                                }
                              />
                              <ActionButton
                                label="Demote"
                                disabled={pending}
                                onClick={() =>
                                  run(() =>
                                    demoteMemberAction(
                                      detail.workspace.id,
                                      member.userId,
                                    ),
                                  )
                                }
                              />
                              <ActionButton
                                label="Remove"
                                danger
                                disabled={pending}
                                onClick={() =>
                                  run(() =>
                                    removeMemberAction(
                                      detail.workspace.id,
                                      member.userId,
                                    ),
                                  )
                                }
                              />
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Invite history">
                    {detail.invitations.length === 0 ? (
                      <p className="text-xs text-[var(--admin-muted)]">
                        No invitations recorded.
                      </p>
                    ) : (
                      <ul className="space-y-1.5 text-xs text-[var(--admin-muted)]">
                        {detail.invitations.map((invite) => (
                          <li key={invite.id}>
                            {invite.email} · {invite.role} · {invite.status} ·{" "}
                            {formatWhen(invite.createdAt)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  <Section title="Projects">
                    <ul className="space-y-1.5 text-xs text-[var(--admin-muted)]">
                      {detail.projects.length === 0 ? (
                        <li>No projects.</li>
                      ) : (
                        detail.projects.map((project) => (
                          <li key={project.id}>
                            {project.name} · {project.status} ·{" "}
                            {formatWhen(project.createdAt)}
                          </li>
                        ))
                      )}
                    </ul>
                  </Section>

                  <Section title="API Keys">
                    <ul className="space-y-1.5 text-xs text-[var(--admin-muted)]">
                      {detail.apiKeys.length === 0 ? (
                        <li>No API keys.</li>
                      ) : (
                        detail.apiKeys.map((key) => (
                          <li key={key.id}>
                            {key.name} · {key.keyPrefix}… · {key.environment} ·{" "}
                            {key.status}
                          </li>
                        ))
                      )}
                    </ul>
                  </Section>

                  <Section title="Activity timeline">
                    <ul className="space-y-2">
                      {detail.activity.length === 0 ? (
                        <li className="text-xs text-[var(--admin-muted)]">
                          No activity yet.
                        </li>
                      ) : (
                        detail.activity.slice(0, 25).map((item) => (
                          <li
                            key={item.id}
                            className="rounded-lg border border-[var(--admin-border)]/60 px-3 py-2"
                          >
                            <p className="text-xs font-medium text-[var(--admin-text)]">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[var(--admin-muted)]">
                              {item.detail}
                            </p>
                            <p className="mt-1 text-[10px] text-[var(--admin-muted)]">
                              {formatWhen(item.occurredAt)}
                            </p>
                          </li>
                        ))
                      )}
                    </ul>
                  </Section>

                  <Section title="Admin audit logs">
                    <ul className="space-y-2">
                      {detail.auditLogs.length === 0 ? (
                        <li className="text-xs text-[var(--admin-muted)]">
                          No admin audit entries for this workspace.
                        </li>
                      ) : (
                        detail.auditLogs.map((log) => (
                          <li
                            key={log.id}
                            className="rounded-lg border border-[var(--admin-border)]/60 px-3 py-2 text-xs text-[var(--admin-muted)]"
                          >
                            <span className="text-[var(--admin-text)]">
                              {log.action}
                            </span>
                            {" · "}
                            {log.summary}
                            <span className="mt-1 block text-[10px]">
                              {formatWhen(log.createdAt)}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
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

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Grid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl border border-[var(--admin-border)]/60 bg-[var(--admin-surface)]/50 px-3 py-2"
        >
          <dt className="text-[10px] uppercase tracking-wide text-[var(--admin-muted)]">
            {label}
          </dt>
          <dd className="mt-0.5 break-words text-sm text-[var(--admin-text)]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
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
      className={`rounded-lg border px-2.5 py-1.5 text-xs transition disabled:opacity-40 ${
        danger
          ? "border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
          : "border-[var(--admin-border)] text-[var(--admin-text)] hover:bg-[var(--admin-surface)]"
      }`}
    >
      {label}
    </button>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-14 rounded-xl bg-[var(--admin-surface)]"
        />
      ))}
    </div>
  );
}

function MiniBars({
  title,
  points,
  color,
}: {
  title: string;
  points: { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className="mb-3">
      <p className="mb-1 text-[10px] text-[var(--admin-muted)]">{title}</p>
      <div
        className="flex h-12 items-end gap-0.5"
        role="img"
        aria-label={title}
      >
        {points.map((point) => (
          <div
            key={point.label}
            className="min-w-0 flex-1 rounded-t-sm"
            style={{
              height: `${Math.max(4, (point.value / max) * 100)}%`,
              background: color,
              opacity: point.value === 0 ? 0.2 : 0.85,
            }}
            title={`${point.label}: ${point.value}`}
          />
        ))}
      </div>
    </div>
  );
}

function WorkspaceAnalyticsChart({
  points,
}: {
  points: AdminWorkspaceDetail["analytics"];
}) {
  const width = 640;
  const height = 160;
  const pad = { top: 12, right: 8, bottom: 22, left: 28 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const series = [
    { key: "projects" as const, color: "#34d399", label: "Projects" },
    { key: "apiRequests" as const, color: "#fbbf24", label: "API" },
    { key: "errors" as const, color: "#f87171", label: "Errors" },
    { key: "aiTokens" as const, color: "#a78bfa", label: "AI" },
    { key: "members" as const, color: "#60a5fa", label: "Members" },
    { key: "growth" as const, color: "#fb7185", label: "Growth" },
  ];
  const max = Math.max(
    1,
    ...points.flatMap((p) => series.map((s) => p[s.key])),
  );

  const x = (i: number) =>
    pad.left +
    (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 text-[10px] text-[var(--admin-muted)]">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Workspace analytics"
      >
        {series.map((s) => {
          const d = points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[s.key])}`)
            .join(" ");
          return (
            <path
              key={s.key}
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth="1.5"
              opacity={0.9}
            />
          );
        })}
      </svg>
    </div>
  );
}
