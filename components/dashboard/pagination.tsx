"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDictionary } from "@/components/i18n/locale-provider";
import { fillTemplate } from "@/lib/i18n/fill-template";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const buttonClass =
  "inline-flex size-9 items-center justify-center rounded-xl border border-zt-border bg-white/[0.02] text-zt-muted transition-all hover:border-zt-border-strong hover:bg-white/[0.05] hover:text-zt-text active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zt-primary/50";

/** Reusable, controlled pagination control. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const { dict } = useDictionary();
  const shell = dict.dash.shell;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <p className="text-xs text-zt-muted">
        {fillTemplate(shell.pageOf, { current: page, total: totalPages })}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label={shell.previousPage}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label={shell.nextPage}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
