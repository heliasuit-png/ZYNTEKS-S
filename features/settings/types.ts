export interface SettingsActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialSettingsActionState: SettingsActionState = {
  status: "idle",
};

export type ThemePreference = "dark" | "light" | "system";
export type DensityPreference = "comfortable" | "compact";
export type SidebarStylePreference = "expanded" | "collapsed" | "icons";

export interface AppearancePreferences {
  theme: ThemePreference;
  accent: string;
  reducedMotion: boolean;
  sidebarStyle: SidebarStylePreference;
  density: DensityPreference;
}

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  theme: "dark",
  accent: "blue",
  reducedMotion: false,
  sidebarStyle: "expanded",
  density: "comfortable",
};
