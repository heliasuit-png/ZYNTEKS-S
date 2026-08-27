"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useDictionary } from "@/components/i18n/locale-provider";
import { allowedNextStatuses } from "@/features/incidents/lib/transitions";
import { addIncidentUpdateAction } from "@/features/incidents/actions";
import { initialIncidentActionState } from "@/features/incidents/types";
import type { IncidentStatus } from "@/types/database";

interface IncidentUpdateFormProps {
  incidentId: string;
  currentStatus: IncidentStatus;
}

function fill(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function IncidentUpdateForm({
  incidentId,
  currentStatus,
}: IncidentUpdateFormProps) {
  const { dict } = useDictionary();
  const t = dict.dash.incidents;
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    addIncidentUpdateAction,
    initialIncidentActionState,
  );
  const handledRef = useRef<typeof state | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const nextStatuses = allowedNextStatuses(currentStatus);

  useEffect(() => {
    if (state.status === "success" && handledRef.current !== state) {
      handledRef.current = state;
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  const errorMessage =
    state.status === "error" && state.message ? state.message : null;

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      <div className="space-y-1">
        <label
          htmlFor="incident-message"
          className="text-xs font-medium text-zt-muted"
        >
          {t.postAnUpdate}
        </label>
        <textarea
          id="incident-message"
          name="message"
          rows={3}
          required
          placeholder={t.postUpdatePlaceholder}
          className="w-full rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-text outline-none transition-colors focus:border-zt-primary"
        />
        {state.fieldErrors?.message ? (
          <p className="text-xs text-zt-danger">
            {state.fieldErrors.message[0]}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="status"
          defaultValue=""
          aria-label={t.changeStatusAria}
          className="rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-text outline-none transition-colors focus:border-zt-primary"
        >
          <option value="">
            {fill(t.keepStatus, { status: t.statuses[currentStatus] })}
          </option>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {fill(t.setTo, { status: t.statuses[status] })}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zt-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90 disabled:opacity-60"
        >
          {isPending ? t.posting : t.postUpdate}
        </button>
        {errorMessage ? (
          <span className="text-xs text-zt-danger">{errorMessage}</span>
        ) : null}
      </div>
      <p className="text-[11px] text-zt-muted">{t.statusFlowHint}</p>
    </form>
  );
}
