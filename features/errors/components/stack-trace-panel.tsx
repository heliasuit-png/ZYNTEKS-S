"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "highlight.js/styles/github-dark.css";

import { CopyButton } from "@/components/dashboard/copy-button";
import { cn } from "@/lib/utils";
import { parseStackTrace } from "@/features/errors/lib/stack-trace";

hljs.registerLanguage("javascript", javascript);

interface StackTracePanelProps {
  stack: string | null;
  className?: string;
}

export function StackTracePanel({ stack, className }: StackTracePanelProps) {
  const frames = useMemo(() => parseStackTrace(stack), [stack]);
  const [hideFramework, setHideFramework] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [allOpen, setAllOpen] = useState(true);

  const highlighted = useMemo(() => {
    if (!stack?.trim()) return "";
    try {
      return hljs.highlight(stack, { language: "javascript" }).value;
    } catch {
      return hljs.highlightAuto(stack).value;
    }
  }, [stack]);

  const visible = hideFramework
    ? frames.filter((f) => !f.isFramework)
    : frames;
  const hiddenCount = frames.length - visible.length;

  if (!stack?.trim()) {
    return (
      <p className="text-sm text-zt-muted">No stack trace was captured.</p>
    );
  }

  function toggleFrame(id: string) {
    setExpanded((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? allOpen),
    }));
  }

  function isOpen(id: string) {
    return expanded[id] ?? allOpen;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton value={stack} label="Copy Stack Trace" />
        <button
          type="button"
          onClick={() => setHideFramework((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zt-border bg-zt-surface-2 px-2.5 py-1.5 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
        >
          {hideFramework ? (
            <EyeOff className="size-3.5" aria-hidden />
          ) : (
            <Eye className="size-3.5" aria-hidden />
          )}
          {hideFramework
            ? `Show framework frames${hiddenCount ? ` (${hiddenCount})` : ""}`
            : "Hide framework noise"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAllOpen((v) => !v);
            setExpanded({});
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zt-border bg-zt-surface-2 px-2.5 py-1.5 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
        >
          {allOpen ? "Collapse Stack Trace" : "Expand Stack Trace"}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-zt-muted">
          All frames look like framework noise. Show framework frames to inspect
          them.
        </p>
      ) : (
        <ul className="space-y-1.5" aria-label="Stack frames">
          {visible.map((frame) => {
            const open = isOpen(frame.id);
            return (
              <li
                key={frame.id}
                className={cn(
                  "overflow-hidden rounded-xl border transition-colors",
                  frame.isAppCode
                    ? "border-zt-primary/40 bg-zt-primary/5"
                    : "border-zt-border bg-zt-surface-2/60",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleFrame(frame.id)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
                  aria-expanded={open}
                >
                  {open ? (
                    <ChevronDown
                      className="mt-0.5 size-3.5 shrink-0 text-zt-muted"
                      aria-hidden
                    />
                  ) : (
                    <ChevronRight
                      className="mt-0.5 size-3.5 shrink-0 text-zt-muted"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-zt-text">
                      {frame.functionName ?? "<anonymous>"}
                      {frame.isAppCode ? (
                        <span className="ml-2 rounded bg-zt-primary/20 px-1.5 py-0.5 text-[10px] font-sans font-medium text-zt-primary">
                          app
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate font-mono text-[11px] text-zt-muted">
                      {frame.file ?? "unknown"}
                      {frame.line != null ? `:${frame.line}` : ""}
                      {frame.column != null ? `:${frame.column}` : ""}
                    </p>
                  </div>
                </button>
                {open ? (
                  <pre className="overflow-x-auto border-t border-zt-border/60 px-3 py-2 font-mono text-[11px] text-zt-muted">
                    {frame.raw}
                  </pre>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <details className="group rounded-xl border border-zt-border bg-black/30">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text">
          Full stack (syntax highlighted)
        </summary>
        <pre className="overflow-x-auto border-t border-zt-border p-3 text-[11px] leading-relaxed">
          <code
            className="hljs language-javascript"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </details>
    </div>
  );
}
