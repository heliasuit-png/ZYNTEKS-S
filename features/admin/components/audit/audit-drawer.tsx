"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useDictionary } from "@/components/i18n/locale-provider";
import type { AuditEventDetail } from "@/services/admin/audit-center.types";
import { loadAuditEventDetailAction } from "@/features/admin/audit-actions";
import {
  formatRelative,
  formatWhen,
} from "@/features/admin/components/executive/format";
import { ADMIN_DRAWER } from "@/features/admin/components/ui/admin-motion";

function JsonBlock({ value, label }: { value: unknown; label: string }) {
  return (
    <div>
      <p className="admin-eyebrow mb-1">{label}</p>
      <pre className="max-h-56 overflow-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-[11px] leading-relaxed text-[var(--admin-text)]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[var(--admin-muted)]">
        {label}
      </p>
      <div className="mt-1 text-sm text-[var(--admin-text)]">{children}</div>
    </div>
  );
}

export function AuditDrawer({
  eventId,
  onClose,
}: {
  eventId: string | null;
  onClose: () => void;
}) {
  const { dict, locale } = useDictionary();
  const t = dict.admin.audit.drawer;
  const common = dict.admin.common;
  const [detail, setDetail] = useState<AuditEventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!eventId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setError(null);
    startTransition(async () => {
      try {
        const data = await loadAuditEventDetailAction(eventId);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t.failed);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, t.failed]);

  return (
    <AnimatePresence>
      {eventId ? (
        <>
          <motion.button
            type="button"
            aria-label={t.closeAria}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            {...ADMIN_DRAWER.overlay}
            onClick={onClose}
          />
          <motion.aside
            className="admin-glass fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-[var(--admin-border)] bg-[rgba(6,12,24,0.96)] shadow-2xl"
            {...ADMIN_DRAWER.panel}
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
              <div>
                <p className="admin-eyebrow">{t.eyebrow}</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--admin-text)]">
                  {detail?.actionLabel ?? t.loading}
                </h2>
                {detail ? (
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    {formatWhen(detail.timestamp)} ·{" "}
                    {formatRelative(detail.timestamp, locale)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="admin-btn-ghost"
              >
                {common.close}
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {pending && !detail ? (
                <p className="text-sm text-[var(--admin-muted)]">
                  {t.loadingEvent}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}
              {detail ? (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label={t.fields.actor}>
                      {detail.actorEmail || detail.actorName || "—"}
                    </Field>
                    <Field label={t.fields.role}>
                      {detail.actorRole ?? "—"}
                    </Field>
                    <Field label={t.fields.category}>{detail.category}</Field>
                    <Field label={t.fields.severity}>{detail.severity}</Field>
                    <Field label={t.fields.targetType}>{detail.targetType}</Field>
                    <Field label={t.fields.target}>
                      {detail.targetName ?? "—"}
                    </Field>
                    <Field label={t.fields.workspace}>
                      {detail.workspaceName ?? "—"}
                    </Field>
                    <Field label={t.fields.project}>
                      {detail.projectName ?? "—"}
                    </Field>
                    <Field label={t.fields.ip}>{detail.ipAddress ?? "—"}</Field>
                    <Field label={t.fields.result}>{detail.result}</Field>
                  </div>

                  <Field label={t.fields.summary}>{detail.summary}</Field>

                  <div>
                    <p className="admin-eyebrow mb-2">{t.relatedEntities}</p>
                    {detail.relatedEntities.length === 0 ? (
                      <p className="text-xs text-[var(--admin-muted)]">
                        {t.noRelated}
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {detail.relatedEntities.map((entity) => (
                          <li
                            key={`${entity.kind}-${entity.id}`}
                            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-xs text-[var(--admin-text)]"
                          >
                            <span className="text-[var(--admin-accent-text)]">
                              {entity.kind}
                            </span>
                            {" · "}
                            {entity.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <JsonBlock
                    label={t.fields.previousState}
                    value={detail.previousState ?? null}
                  />
                  <JsonBlock
                    label={t.fields.newState}
                    value={detail.newState ?? null}
                  />
                  <JsonBlock
                    label={t.fields.jsonPayload}
                    value={detail.metadata}
                  />
                </>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
