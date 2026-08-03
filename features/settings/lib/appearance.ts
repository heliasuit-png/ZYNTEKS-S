import type { AppearancePreferences } from "@/features/settings/types";

export const ACCENT_PRESETS = [
  { id: "blue", label: "Signal", primary: "#3b82f6", secondary: "#7c3aed" },
  { id: "violet", label: "Nebula", primary: "#7c3aed", secondary: "#ff4fd8" },
  { id: "emerald", label: "Aurora", primary: "#00ff88", secondary: "#00e5ff" },
  { id: "amber", label: "Ember", primary: "#ffb020", secondary: "#ff3b5c" },
  { id: "rose", label: "Bloom", primary: "#ff3b5c", secondary: "#ff4fd8" },
  { id: "cyan", label: "Lagoon", primary: "#00e5ff", secondary: "#3b82f6" },
] as const;

export type AccentId = (typeof ACCENT_PRESETS)[number]["id"];

export function applyClientAppearance(prefs: AppearancePreferences) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.dataset.theme = prefs.theme;
  root.dataset.density = prefs.density;
  root.dataset.sidebarStyle = prefs.sidebarStyle;
  root.classList.toggle("reduce-motion", prefs.reducedMotion);

  if (prefs.theme === "light") {
    root.classList.remove("dark");
  } else if (prefs.theme === "dark") {
    root.classList.add("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }

  const accent =
    ACCENT_PRESETS.find((item) => item.id === prefs.accent) ?? ACCENT_PRESETS[0];
  root.style.setProperty("--color-zt-primary", accent.primary);
  root.style.setProperty("--color-zt-secondary", accent.secondary);
  root.style.setProperty("--zt-grad-1", accent.primary);
  root.style.setProperty("--zt-grad-2", accent.secondary);

  try {
    window.localStorage.setItem("zt:accent", prefs.accent);
    window.localStorage.setItem("zt:theme", prefs.theme);
    window.localStorage.setItem("zt:density", prefs.density);
    window.localStorage.setItem("zt:sidebarStyle", prefs.sidebarStyle);
    window.localStorage.setItem(
      "zt:reducedMotion",
      prefs.reducedMotion ? "1" : "0",
    );
    window.localStorage.setItem(
      "zt:sidebar:collapsed",
      prefs.sidebarStyle === "collapsed" || prefs.sidebarStyle === "icons"
        ? "1"
        : "0",
    );
  } catch {
    // best-effort
  }
}

/** Inline script: apply theme/accent before paint to avoid flash. */
export const APPEARANCE_BOOTSTRAP_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("zt:theme")||"dark";var a=localStorage.getItem("zt:accent")||"blue";var dens=localStorage.getItem("zt:density");var side=localStorage.getItem("zt:sidebarStyle");var rm=localStorage.getItem("zt:reducedMotion")==="1";d.dataset.theme=t;if(dens)d.dataset.density=dens;if(side)d.dataset.sidebarStyle=side;d.classList.toggle("reduce-motion",rm);var dark=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",t==="light"?false:dark);var map={blue:["#3b82f6","#7c3aed"],violet:["#7c3aed","#ff4fd8"],emerald:["#00ff88","#00e5ff"],amber:["#ffb020","#ff3b5c"],rose:["#ff3b5c","#ff4fd8"],cyan:["#00e5ff","#3b82f6"]};var c=map[a]||map.blue;d.style.setProperty("--color-zt-primary",c[0]);d.style.setProperty("--color-zt-secondary",c[1]);d.style.setProperty("--zt-grad-1",c[0]);d.style.setProperty("--zt-grad-2",c[1]);}catch(e){document.documentElement.classList.add("dark");}})();`;
