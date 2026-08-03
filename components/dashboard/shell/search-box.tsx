"use client";

import { Search } from "lucide-react";

import { useCommandPalette } from "@/components/dashboard/command-palette/command-palette-context";

export function SearchBox() {
  const { openPalette } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={openPalette}
      aria-label="Open command palette"
      className="group hidden h-10 w-full max-w-md items-center gap-2 rounded-xl border border-zt-border bg-white/[0.02] px-3 text-sm text-zt-muted transition-all duration-300 hover:border-zt-border-strong hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zt-primary/50 sm:flex"
    >
      <Search
        className="size-4 shrink-0 transition-colors group-hover:text-zt-text"
        aria-hidden
      />
      <span className="flex-1 text-left">Search or jump to…</span>
      <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-zt-border bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-zt-muted md:flex">
        ⌘K
      </kbd>
    </button>
  );
}
