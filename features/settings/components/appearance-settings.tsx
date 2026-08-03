"use client";

import { useActionState, useEffect } from "react";

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
          <PanelTitle>Appearance</PanelTitle>
          <PanelDescription>
            Theme, accent color, motion, sidebar style and density. Saved to your
            account and this device.
          </PanelDescription>
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
                Theme
                <select
                  name="theme"
                  defaultValue={preferences.theme}
                  className={inputClass}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </label>
              <label className="space-y-1 text-xs text-zt-muted">
                Accent color
                <select
                  name="accent"
                  defaultValue={preferences.accent}
                  className={inputClass}
                >
                  {ACCENT_PRESETS.map((accent) => (
                    <option key={accent.id} value={accent.id}>
                      {accent.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs text-zt-muted">
                Sidebar style
                <select
                  name="sidebarStyle"
                  defaultValue={preferences.sidebarStyle}
                  className={inputClass}
                >
                  <option value="expanded">Expanded</option>
                  <option value="collapsed">Collapsed</option>
                  <option value="icons">Icons</option>
                </select>
              </label>
              <label className="space-y-1 text-xs text-zt-muted">
                Density
                <select
                  name="density"
                  defaultValue={preferences.density}
                  className={inputClass}
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
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
              Reduced motion
            </label>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={pending} className={buttonClass}>
                {pending ? "Saving…" : "Save appearance"}
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
