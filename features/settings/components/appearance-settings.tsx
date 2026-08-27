"use client";

import { useActionState, useEffect } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelDescription,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import {
  initialSettingsActionState,
  updateAppearanceAction,
} from "@/features/settings/actions";
import {
  ACCENT_PRESETS,
  applyClientAppearance,
} from "@/features/settings/lib/appearance";
import type { AppearancePreferences } from "@/features/settings/types";

const inputClass =
  "w-full rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-text outline-none focus:border-zt-primary";
const buttonClass =
  "rounded-lg bg-zt-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90 disabled:opacity-60";

export function AppearanceSettings({
  preferences,
}: {
  preferences: AppearancePreferences;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.settings.appearance;
  const common = dict.dashboardCommon;

  const [state, action, pending] = useActionState(
    updateAppearanceAction,
    initialSettingsActionState,
  );

  useEffect(() => {
    applyClientAppearance(preferences);
  }, [preferences]);

  return (
    <FadeIn>
      <Panel>
        <PanelHeader>
          <PanelTitle>{t.title}</PanelTitle>
          <PanelDescription>{t.desc}</PanelDescription>
        </PanelHeader>
        <PanelContent>
          <form
            action={action}
            className="space-y-4"
            onSubmit={(event) => {
              const form = event.currentTarget;
              const data = new FormData(form);
              applyClientAppearance({
                theme: String(
                  data.get("theme") ?? "dark",
                ) as AppearancePreferences["theme"],
                accent: String(data.get("accent") ?? "blue"),
                reducedMotion: data.get("reducedMotion") === "on",
                sidebarStyle: String(
                  data.get("sidebarStyle") ?? "expanded",
                ) as AppearancePreferences["sidebarStyle"],
                density: String(
                  data.get("density") ?? "comfortable",
                ) as AppearancePreferences["density"],
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-zt-muted">
                {t.theme}
                <select
                  name="theme"
                  defaultValue={preferences.theme}
                  className={inputClass}
                >
                  <option value="dark">{t.themeDark}</option>
                  <option value="light">{t.themeLight}</option>
                  <option value="system">{t.themeSystem}</option>
                </select>
              </label>
              <label className="space-y-1 text-xs text-zt-muted">
                {t.accentColor}
                <select
                  name="accent"
                  defaultValue={preferences.accent}
                  className={inputClass}
                >
                  {ACCENT_PRESETS.map((accent) => (
                    <option key={accent.id} value={accent.id}>
                      {t.accents[accent.id]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs text-zt-muted">
                {t.sidebar}
                <select
                  name="sidebarStyle"
                  defaultValue={preferences.sidebarStyle}
                  className={inputClass}
                >
                  <option value="expanded">{t.sidebarExpanded}</option>
                  <option value="collapsed">{t.sidebarCollapsed}</option>
                  <option value="icons">{t.sidebarIcons}</option>
                </select>
              </label>
              <label className="space-y-1 text-xs text-zt-muted">
                {t.density}
                <select
                  name="density"
                  defaultValue={preferences.density}
                  className={inputClass}
                >
                  <option value="comfortable">{t.densityComfortable}</option>
                  <option value="compact">{t.densityCompact}</option>
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-zt-text">
              <input
                type="checkbox"
                name="reducedMotion"
                defaultChecked={preferences.reducedMotion}
                className="size-4 accent-zt-primary"
              />
              {t.reducedMotion}
            </label>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={pending} className={buttonClass}>
                {pending ? common.saving : t.saveAppearance}
              </button>
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
  );
}
