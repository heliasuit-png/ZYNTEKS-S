"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { DASHBOARD_ROUTES } from "@/lib/constants";

/** Sequences that follow a `g` prefix (Linear/GitHub-style navigation). */
const GO_TO: Record<string, string> = {
  p: DASHBOARD_ROUTES.projects,
  e: DASHBOARD_ROUTES.errors,
  a: DASHBOARD_ROUTES.aiAssistant,
  h: DASHBOARD_ROUTES.health,
  i: DASHBOARD_ROUTES.incidents,
  d: DASHBOARD_ROUTES.dashboard,
};

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/**
 * Global "g then key" navigation shortcuts. Mounted once inside the dashboard
 * shell. Ignores keystrokes while typing in form fields and never interferes
 * with modifier combos (which the command palette handles).
 */
export function GlobalShortcuts() {
  const router = useRouter();
  const pending = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const clearPending = () => {
      pending.current = false;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditable(event.target)) return;

      const key = event.key.toLowerCase();

      if (pending.current) {
        const href = GO_TO[key];
        clearPending();
        if (href) {
          event.preventDefault();
          router.push(href);
        }
        return;
      }

      if (key === "g") {
        pending.current = true;
        timer.current = window.setTimeout(clearPending, 1200);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [router]);

  return null;
}
