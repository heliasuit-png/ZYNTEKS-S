"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/dashboard/dropdown";
import { ACCENT_PRESETS } from "@/features/settings/lib/appearance";

const STORAGE_KEY = "zt:accent";

function applyAccent(primary: string, secondary: string) {
  const root = document.documentElement;
  root.style.setProperty("--color-zt-primary", primary);
  root.style.setProperty("--color-zt-secondary", secondary);
  root.style.setProperty("--zt-grad-1", primary);
  root.style.setProperty("--zt-grad-2", secondary);
}

export function AppearanceMenu() {
  const [activeId, setActiveId] = useState("blue");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const accent = ACCENT_PRESETS.find((a) => a.id === saved);
      if (accent) {
        setActiveId(accent.id);
        applyAccent(accent.primary, accent.secondary);
      }
    } catch {
      // localStorage unavailable — keep the default accent.
    }
  }, []);

  function select(accent: (typeof ACCENT_PRESETS)[number]) {
    setActiveId(accent.id);
    applyAccent(accent.primary, accent.secondary);
    try {
      window.localStorage.setItem(STORAGE_KEY, accent.id);
    } catch {
      // best-effort persistence only
    }
  }

  return (
    <Dropdown
      align="end"
      menuClassName="w-64"
      trigger={
        <span className="flex size-9 items-center justify-center rounded-xl border border-zt-border bg-white/[0.02] text-zt-muted transition-colors hover:border-zt-border-strong hover:text-zt-text">
          <Palette className="size-4" aria-hidden />
        </span>
      }
    >
      <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-zt-muted">
        Accent color
      </div>
      <div className="grid grid-cols-3 gap-2 p-2">
        {ACCENT_PRESETS.map((accent) => {
          const isActive = accent.id === activeId;
          return (
            <button
              key={accent.id}
              type="button"
              onClick={() => select(accent)}
              aria-label={accent.label}
              aria-pressed={isActive}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all",
                isActive
                  ? "border-zt-border-strong bg-white/[0.05]"
                  : "border-transparent hover:bg-white/[0.03]",
              )}
            >
              <span
                className="relative flex size-8 items-center justify-center rounded-full"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`,
                }}
              >
                {isActive ? (
                  <Check className="size-4 text-white" aria-hidden />
                ) : null}
              </span>
              <span className="text-[11px] text-zt-muted group-hover:text-zt-text">
                {accent.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="px-3 pb-2 pt-1 text-[11px] text-zt-muted">
        Preference is saved on this device.
      </p>
    </Dropdown>
  );
}
