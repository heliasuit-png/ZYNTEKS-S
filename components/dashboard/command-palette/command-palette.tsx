"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Bug,
  Building2,
  CornerDownLeft,
  FolderKanban,
  KeyRound,
  Pin,
  Plus,
  Search,
  Siren,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { navItems } from "@/components/dashboard/shell/nav-config";
import { useCommandPalette } from "@/components/dashboard/command-palette/command-palette-context";

type CommandGroup =
  | "Actions"
  | "Navigation"
  | "Members"
  | "Workspaces"
  | "Projects"
  | "Errors"
  | "Incidents"
  | "Notifications"
  | "API Keys"
  | "AI Chats";

interface CommandEntry {
  id: string;
  label: string;
  href: string;
  group: CommandGroup;
  icon: LucideIcon;
  keywords?: string;
}

const GROUP_ICONS: Record<string, LucideIcon> = {
  Members: Users,
  Workspaces: Building2,
  Projects: FolderKanban,
  Errors: Bug,
  Incidents: Siren,
  Notifications: Bell,
  "API Keys": KeyRound,
  "AI Chats": Sparkles,
};

const RECENT_KEY = "zt:cmdk:recent";
const PINNED_KEY = "zt:cmdk:pinned";
const RECENT_LIMIT = 5;

function readIds(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // best-effort persistence only
  }
}

const actionEntries: CommandEntry[] = [
  {
    id: "action-create-project",
    label: "Create Project",
    href: DASHBOARD_ROUTES.projects,
    group: "Actions",
    icon: Plus,
    keywords: "new add project",
  },
  {
    id: "action-generate-key",
    label: "Generate API Key",
    href: DASHBOARD_ROUTES.apiKeys,
    group: "Actions",
    icon: KeyRound,
    keywords: "api key token secret",
  },
  {
    id: "action-open-ai",
    label: "Open AI Assistant",
    href: DASHBOARD_ROUTES.aiAssistant,
    group: "Actions",
    icon: Sparkles,
    keywords: "ai chat assistant analyze",
  },
  {
    id: "action-view-errors",
    label: "View Errors",
    href: DASHBOARD_ROUTES.errors,
    group: "Actions",
    icon: Bug,
    keywords: "errors monitoring logs",
  },
];

export function CommandPalette({ workspaceId }: { workspaceId?: string }) {
  const { open, closePalette } = useCommandPalette();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [remoteHits, setRemoteHits] = useState<CommandEntry[]>([]);

  const entries = useMemo<CommandEntry[]>(() => {
    const navEntries: CommandEntry[] = navItems.map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      href: item.href,
      group: "Navigation",
      icon: item.icon,
    }));
    return [...actionEntries, ...navEntries];
  }, []);

  // Reset state and load recents when the palette opens.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    setRemoteHits([]);
    setRecentIds(readIds(RECENT_KEY));
    setPinnedIds(readIds(PINNED_KEY));
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open]);

  // Enterprise live search across workspace resources.
  useEffect(() => {
    if (!open || !workspaceId) return;
    const q = query.trim();
    if (q.length < 2) {
      setRemoteHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/workspace/search?workspaceId=${encodeURIComponent(workspaceId)}&q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const payload = (await res.json()) as {
          success?: boolean;
          data?: {
            items?: Array<{
              id: string;
              label: string;
              href: string;
              group: CommandGroup;
              keywords?: string;
            }>;
          };
          items?: Array<{
            id: string;
            label: string;
            href: string;
            group: CommandGroup;
            keywords?: string;
          }>;
        };
        // Prefer standardized `{ success, data: { items } }`; keep legacy `{ items }` fallback.
        const items = payload.data?.items ?? payload.items ?? [];
        setRemoteHits(
          items.map((item) => ({
            ...item,
            icon: GROUP_ICONS[item.group] ?? Search,
          })),
        );
      } catch {
        // aborted or network error — ignore
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query, workspaceId]);

  const togglePin = useCallback(
    (event: React.MouseEvent, id: string) => {
      event.stopPropagation();
      setPinnedIds((current) => {
        const next = current.includes(id)
          ? current.filter((value) => value !== id)
          : [id, ...current];
        writeIds(PINNED_KEY, next);
        return next;
      });
    },
    [],
  );

  const q = query.trim().toLowerCase();

  // Build the ordered, grouped, visible sections.
  const sections = useMemo(() => {
    const matches = (entry: CommandEntry) =>
      q.length === 0 ||
      entry.label.toLowerCase().includes(q) ||
      (entry.keywords?.includes(q) ?? false);

    const result: Array<{ label: string; items: CommandEntry[] }> = [];

    if (q.length === 0) {
      const pinned = pinnedIds
        .map((id) => entries.find((entry) => entry.id === id))
        .filter((entry): entry is CommandEntry => Boolean(entry));
      if (pinned.length > 0) {
        result.push({ label: "Pinned", items: pinned });
      }

      const recents = recentIds
        .filter((id) => !pinnedIds.includes(id))
        .map((id) => entries.find((entry) => entry.id === id))
        .filter((entry): entry is CommandEntry => Boolean(entry));
      if (recents.length > 0) {
        result.push({ label: "Recent", items: recents });
      }
    }

    const actions = entries.filter((e) => e.group === "Actions" && matches(e));
    const nav = entries.filter((e) => e.group === "Navigation" && matches(e));
    if (actions.length > 0) result.push({ label: "Actions", items: actions });
    if (nav.length > 0) result.push({ label: "Go to", items: nav });

    if (q.length >= 2 && remoteHits.length > 0) {
      const byGroup = new Map<string, CommandEntry[]>();
      for (const hit of remoteHits) {
        const list = byGroup.get(hit.group) ?? [];
        list.push(hit);
        byGroup.set(hit.group, list);
      }
      for (const [label, items] of byGroup) {
        result.push({ label, items });
      }
    }

    return result;
  }, [entries, q, recentIds, pinnedIds, remoteHits]);

  const flat = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections],
  );

  useEffect(() => {
    setActive((current) => (current >= flat.length ? 0 : current));
  }, [flat.length]);

  const select = useCallback(
    (entry: CommandEntry | undefined) => {
      if (!entry) return;
      try {
        const next = [entry.id, ...recentIds.filter((id) => id !== entry.id)].slice(
          0,
          RECENT_LIMIT,
        );
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable; recents are best-effort only.
      }
      closePalette();
      router.push(entry.href);
    },
    [closePalette, recentIds, router],
  );

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % Math.max(flat.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + flat.length) % Math.max(flat.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(flat[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
    }
  }

  let runningIndex = -1;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closePalette}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={onKeyDown}
            className="zt-glass-strong relative w-full max-w-xl overflow-hidden rounded-2xl border border-zt-border shadow-2xl shadow-black/60"
          >
            <div className="flex items-center gap-3 border-b border-zt-border px-4">
              <Search className="size-4 shrink-0 text-zt-muted" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                placeholder="Search or jump to…"
                aria-label="Search commands"
                className="h-12 w-full bg-transparent text-sm text-zt-text placeholder:text-zt-muted focus:outline-none"
              />
              <kbd className="hidden shrink-0 rounded-md border border-zt-border bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-zt-muted sm:block">
                ESC
              </kbd>
            </div>

            <div
              role="listbox"
              aria-label="Commands"
              className="max-h-[52vh] overflow-y-auto p-2"
            >
              {flat.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-zt-muted">
                  No results for “{query}”.
                </p>
              ) : (
                sections.map((section) => (
                  <div key={section.label} className="mb-1">
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zt-muted">
                      {section.label}
                    </p>
                    {section.items.map((entry) => {
                      runningIndex += 1;
                      const index = runningIndex;
                      const isActive = index === active;
                      const isPinned = pinnedIds.includes(entry.id);
                      const Icon = entry.icon;
                      return (
                        <div
                          key={`${section.label}-${entry.id}`}
                          role="option"
                          aria-selected={isActive}
                          className={cn(
                            "group/cmd relative rounded-xl transition-colors",
                            isActive ? "bg-white/[0.06]" : "",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => select(entry)}
                            onPointerMove={() => setActive(index)}
                            tabIndex={-1}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 pr-16 text-left text-sm transition-colors",
                              isActive ? "text-zt-text" : "text-zt-muted",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg border border-zt-border",
                                isActive
                                  ? "bg-gradient-to-br from-zt-primary/30 to-zt-secondary/20 text-zt-primary"
                                  : "bg-white/[0.02]",
                              )}
                            >
                              <Icon className="size-4" aria-hidden />
                            </span>
                            <span className="flex-1 truncate text-zt-text">
                              {entry.label}
                            </span>
                          </button>

                          <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(event) => togglePin(event, entry.id)}
                              aria-label={isPinned ? "Unpin" : "Pin"}
                              aria-pressed={isPinned}
                              className={cn(
                                "pointer-events-auto rounded-md p-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zt-primary/50",
                                isPinned
                                  ? "text-zt-primary"
                                  : "text-zt-muted/40 opacity-0 hover:text-zt-text group-hover/cmd:opacity-100",
                              )}
                            >
                              <Pin
                                className="size-3.5"
                                fill={isPinned ? "currentColor" : "none"}
                                aria-hidden
                              />
                            </button>
                            {isActive ? (
                              <CornerDownLeft
                                className="size-4 text-zt-muted"
                                aria-hidden
                              />
                            ) : (
                              <ArrowRight
                                className="size-4 text-zt-muted/40"
                                aria-hidden
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-zt-border px-4 py-2 text-[11px] text-zt-muted">
              <span className="flex items-center gap-2">
                <kbd className="rounded border border-zt-border bg-white/[0.03] px-1.5 py-0.5">
                  ↑↓
                </kbd>
                navigate
                <kbd className="rounded border border-zt-border bg-white/[0.03] px-1.5 py-0.5">
                  ↵
                </kbd>
                open
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-zt-primary" aria-hidden />
                ZYNTEKSIS Command
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
