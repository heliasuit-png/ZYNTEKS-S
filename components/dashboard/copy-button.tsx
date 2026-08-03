"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

/** Reusable copy-to-clipboard button with transient confirmation. */
export function CopyButton({ value, label = "Copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-zt-border bg-zt-surface-2 px-2.5 py-1.5 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-zt-success" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
