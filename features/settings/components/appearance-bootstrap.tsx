"use client";

import { useEffect } from "react";

import { applyClientAppearance } from "@/features/settings/lib/appearance";
import { DEFAULT_APPEARANCE } from "@/features/settings/types";
import type { AppearancePreferences } from "@/features/settings/types";

function readLocalAppearance(): AppearancePreferences {
  try {
    return {
      theme:
        (window.localStorage.getItem("zt:theme") as AppearancePreferences["theme"]) ||
        DEFAULT_APPEARANCE.theme,
      accent: window.localStorage.getItem("zt:accent") || DEFAULT_APPEARANCE.accent,
      reducedMotion: window.localStorage.getItem("zt:reducedMotion") === "1",
      sidebarStyle:
        (window.localStorage.getItem(
          "zt:sidebarStyle",
        ) as AppearancePreferences["sidebarStyle"]) || DEFAULT_APPEARANCE.sidebarStyle,
      density:
        (window.localStorage.getItem(
          "zt:density",
        ) as AppearancePreferences["density"]) || DEFAULT_APPEARANCE.density,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

/** Re-applies saved appearance on dashboard mount and when system theme changes. */
export function AppearanceBootstrap({
  preferences,
}: {
  preferences?: AppearancePreferences | null;
}) {
  useEffect(() => {
    const prefs = preferences ?? readLocalAppearance();
    applyClientAppearance(prefs);

    if (prefs.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyClientAppearance(prefs);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preferences]);

  return null;
}
