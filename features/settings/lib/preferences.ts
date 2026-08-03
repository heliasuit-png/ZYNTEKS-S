import type { Json } from "@/types/database";
import {
  DEFAULT_APPEARANCE,
  type AppearancePreferences,
} from "@/features/settings/types";

export interface AiPreferences {
  defaultModel: string;
  streaming: boolean;
}

export const DEFAULT_AI_PREFERENCES: AiPreferences = {
  defaultModel: "gpt-4o-mini",
  streaming: true,
};

export function parsePreferences(raw: Json | null | undefined): {
  appearance: AppearancePreferences;
  ai: AiPreferences;
} {
  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const appearanceRaw =
    obj.appearance && typeof obj.appearance === "object"
      ? (obj.appearance as Record<string, unknown>)
      : {};
  const aiRaw =
    obj.ai && typeof obj.ai === "object"
      ? (obj.ai as Record<string, unknown>)
      : {};

  return {
    appearance: {
      theme:
        appearanceRaw.theme === "light" ||
        appearanceRaw.theme === "system" ||
        appearanceRaw.theme === "dark"
          ? appearanceRaw.theme
          : DEFAULT_APPEARANCE.theme,
      accent:
        typeof appearanceRaw.accent === "string"
          ? appearanceRaw.accent
          : DEFAULT_APPEARANCE.accent,
      reducedMotion: Boolean(
        appearanceRaw.reducedMotion ?? DEFAULT_APPEARANCE.reducedMotion,
      ),
      sidebarStyle:
        appearanceRaw.sidebarStyle === "collapsed" ||
        appearanceRaw.sidebarStyle === "icons" ||
        appearanceRaw.sidebarStyle === "expanded"
          ? appearanceRaw.sidebarStyle
          : DEFAULT_APPEARANCE.sidebarStyle,
      density:
        appearanceRaw.density === "compact" ||
        appearanceRaw.density === "comfortable"
          ? appearanceRaw.density
          : DEFAULT_APPEARANCE.density,
    },
    ai: {
      defaultModel:
        typeof aiRaw.defaultModel === "string"
          ? aiRaw.defaultModel
          : DEFAULT_AI_PREFERENCES.defaultModel,
      streaming:
        aiRaw.streaming === undefined
          ? DEFAULT_AI_PREFERENCES.streaming
          : Boolean(aiRaw.streaming),
    },
  };
}

export function mergePreferences(
  raw: Json | null | undefined,
  patch: { appearance?: AppearancePreferences; ai?: AiPreferences },
): Json {
  const current = parsePreferences(raw);
  return {
    appearance: { ...(patch.appearance ?? current.appearance) },
    ai: { ...(patch.ai ?? current.ai) },
  } as Json;
}
