"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelDescription,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import {
  deleteAllAiHistoryAction,
  initialSettingsActionState,
  updateAiPreferencesAction,
} from "@/features/settings/actions";
import type { AiPreferences } from "@/features/settings/lib/preferences";
import type { UsageSummary } from "@/services/ai";

const inputClass =
  "w-full rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-text outline-none focus:border-zt-primary";
const buttonClass =
  "rounded-lg bg-zt-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90 disabled:opacity-60";
const dangerClass =
  "rounded-lg border border-zt-danger/40 px-3 py-2 text-sm text-zt-danger transition-colors hover:bg-zt-danger/10 disabled:opacity-60";

export function AiSettingsPanel({
  usage,
  preferences,
  envModel,
  conversationCount,
}: {
  usage: UsageSummary;
  preferences: AiPreferences;
  envModel: string;
  conversationCount: number;
}) {
  const [state, action, pending] = useActionState(
    updateAiPreferencesAction,
    initialSettingsActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAllAiHistoryAction,
    initialSettingsActionState,
  );

  const limitLabel =
    usage.limit === null ? "Unlimited" : `${usage.used} / ${usage.limit}`;

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Monthly usage" value={limitLabel} />
          <Stat
            label="Tokens this month"
            value={usage.tokensThisMonth.toLocaleString()}
          />
          <Stat label="Conversations" value={String(conversationCount)} />
        </div>
      </FadeIn>

      <FadeIn delay={0.04}>
        <Panel>
          <PanelHeader>
            <PanelTitle>AI preferences</PanelTitle>
            <PanelDescription>
              Default model preference and streaming. Platform default is{" "}
              <code className="text-zt-text">{envModel}</code>.
            </PanelDescription>
          </PanelHeader>
          <PanelContent>
            <form action={action} className="space-y-4">
              <label className="block space-y-1 text-xs text-zt-muted">
                Default model
                <select
                  name="defaultModel"
                  defaultValue={preferences.defaultModel || envModel}
                  className={inputClass}
                >
                  <option value={envModel}>{envModel} (platform)</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-zt-text">
                <input
                  type="checkbox"
                  name="streaming"
                  defaultChecked={preferences.streaming}
                  className="size-4 accent-zt-primary"
                />
                Enable streaming responses
              </label>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={pending} className={buttonClass}>
                  {pending ? "Saving…" : "Save AI settings"}
                </button>
                <Link
                  href={DASHBOARD_ROUTES.aiAssistant}
                  className="text-sm text-zt-primary hover:underline"
                >
                  Open AI Assistant
                </Link>
                {state.message ? (
                  <span
                    className={`text-xs ${state.status === "error" ? "text-zt-danger" : "text-zt-success"}`}
                  >
                    {state.message}
                  </span>
                ) : null}
              </div>
            </form>
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.08}>
        <Panel className="border-zt-danger/30">
          <PanelHeader>
            <PanelTitle>Conversation history</PanelTitle>
            <PanelDescription>
              Delete all AI conversations and messages for your account.
            </PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <p className="text-sm text-zt-muted">
              {conversationCount === 0
                ? "No conversation history yet."
                : `${conversationCount} conversation${conversationCount === 1 ? "" : "s"} stored.`}
            </p>
            <form action={deleteAction}>
              <button
                type="submit"
                disabled={deletePending || conversationCount === 0}
                className={dangerClass}
              >
                {deletePending ? "Deleting…" : "Delete history"}
              </button>
            </form>
            {deleteState.message ? (
              <p
                className={`text-xs ${deleteState.status === "error" ? "text-zt-danger" : "text-zt-success"}`}
              >
                {deleteState.message}
              </p>
            ) : null}
          </PanelContent>
        </Panel>
      </FadeIn>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zt-border bg-zt-surface p-4">
      <p className="text-xs text-zt-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zt-text">{value}</p>
    </div>
  );
}
