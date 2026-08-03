"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { INCIDENT_STATUS_LABELS } from "@/lib/constants";
import { allowedNextStatuses } from "@/features/incidents/lib/transitions";
import { addIncidentUpdateAction } from "@/features/incidents/actions";
import { initialIncidentActionState } from "@/features/incidents/types";
import type { IncidentStatus } from "@/types/database";

interface IncidentUpdateFormProps {
  incidentId: string;
  currentStatus: IncidentStatus;
}

export function IncidentUpdateForm({
  incidentId,
  currentStatus,
}: IncidentUpdateFormProps) {
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

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      <div className="space-y-1">
        <label
          htmlFor="incident-message"
          className="text-xs font-medium text-zt-muted"
        >
          Post an update
        </label>
        <textarea
          id="incident-message"
          name="message"
          rows={3}
          required
          placeholder="Describe the latest status…"
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
          aria-label="Change incident status"
          className="rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-text outline-none transition-colors focus:border-zt-primary"
        >
          <option value="">
            Keep status ({INCIDENT_STATUS_LABELS[currentStatus]})
          </option>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              Set to {INCIDENT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zt-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90 disabled:opacity-60"
        >
          {isPending ? "Posting…" : "Post update"}
        </button>
        {state.status === "error" && state.message ? (
          <span className="text-xs text-zt-danger">{state.message}</span>
        ) : null}
      </div>
      <p className="text-[11px] text-zt-muted">
        Flow: Investigating → Identified → Monitoring → Resolved. Backward
        transitions are blocked.
      </p>
    </form>
  );
}
