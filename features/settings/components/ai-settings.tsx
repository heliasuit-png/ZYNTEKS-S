"use client";

import { useActionState } from "react";
import Link from "next/link";

import { useDictionary } from "@/components/i18n/locale-provider";
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
  const { dict } = useDictionary();
  const t = dict.dash.settings.ai;
  const common = dict.dashboardCommon;

  const [state, action, pending] = useActionState(
    updateAiPreferencesAction,
    initialSettingsActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAllAiHistoryAction,
    initialSettingsActionState,
  );

  const limitLabel =
    usage.limit === null
      ? t.unlimited
      : `${usage.used} / ${usage.limit}`;

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label={t.monthlyUsage} value={limitLabel} />
          <Stat
            label={t.tokensThisMonth}
            value={usage.tokensThisMonth.toLocaleString()}
          />
          <Stat label={t.conversations} value={String(conversationCount)} />
        </div>
      </FadeIn>

      <FadeIn delay={0.04}>
        <Panel>
          <PanelHeader>
            <PanelTitle>{t.prefsTitle}</PanelTitle>
            <PanelDescription>{t.prefsDesc}</PanelDescription>
          </PanelHeader>
          <PanelContent>
            <form action={action} className="space-y-4">
              <label className="block space-y-1 text-xs text-zt-muted">
                {t.defaultModel}
                <select
                  name="defaultModel"
                  defaultValue={preferences.defaultModel || envModel}
                  className={inputClass}
                >
                  <option value={envModel}>
                    {t.platformModel.replace("{model}", envModel)}
                  </option>
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
                {t.enableStreaming}
              </label>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={pending} className={buttonClass}>
                  {pending ? common.saving : t.saveAiSettings}
                </button>
                <Link
                  href={DASHBOARD_ROUTES.aiAssistant}
                  className="text-sm text-zt-primary hover:underline"
                >
                  {t.openAiAssistant}
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
            <PanelTitle>{t.historyTitle}</PanelTitle>
            <PanelDescription>{t.historyDesc}</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <p className="text-sm text-zt-muted">
              {conversationCount === 0
                ? t.noHistory
                : t.conversationsStored.replace(
                    "{count}",
                    String(conversationCount),
                  )}
            </p>
            <form action={deleteAction}>
              <button
                type="submit"
                disabled={deletePending || conversationCount === 0}
                className={dangerClass}
              >
                {deletePending ? t.deleting : t.deleteHistory}
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
