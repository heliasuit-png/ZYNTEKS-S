"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import {
  PACKAGE_MANAGERS,
  SDK_FRAMEWORKS,
} from "@/features/landing/data/content";
import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";
import { cn } from "@/lib/utils";

export function LandingSdk() {
  const [manager, setManager] = useState<(typeof PACKAGE_MANAGERS)[number]["id"]>(
    "npm",
  );
  const [framework, setFramework] = useState<(typeof SDK_FRAMEWORKS)[number]["id"]>(
    "javascript",
  );
  const [copied, setCopied] = useState<"install" | "snippet" | null>(null);

  const install =
    PACKAGE_MANAGERS.find((item) => item.id === manager)?.command ??
    PACKAGE_MANAGERS[0]!.command;
  const snippet =
    SDK_FRAMEWORKS.find((item) => item.id === framework)?.snippet ??
    SDK_FRAMEWORKS[0]!.snippet;

  async function copy(value: string, kind: "install" | "snippet") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // clipboard may be unavailable
    }
  }

  return (
    <LandingSection
      id="sdk"
      eyebrow="SDK"
      title="Install in one command"
      description="Choose your package manager and framework. Generate a key in the dashboard, then ship."
    >
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-zt-border bg-[#070d18]">
          <div className="flex flex-wrap gap-2 border-b border-white/8 p-3">
            {PACKAGE_MANAGERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setManager(item.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  manager === item.id
                    ? "bg-zt-primary text-[#041018]"
                    : "text-zt-muted hover:text-zt-text",
                )}
                aria-pressed={manager === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
            <code className="truncate font-mono text-sm text-zt-text">
              {install}
            </code>
            <button
              type="button"
              onClick={() => void copy(install, "install")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zt-border px-2.5 py-1.5 text-xs text-zt-muted hover:text-zt-text"
              aria-label="Copy install command"
            >
              {copied === "install" ? (
                <Check className="size-3.5 text-zt-success" />
              ) : (
                <Copy className="size-3.5" />
              )}
              Copy
            </button>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-white/8 p-3">
            {SDK_FRAMEWORKS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFramework(item.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  framework === item.id
                    ? "bg-white/10 text-zt-text"
                    : "text-zt-muted hover:text-zt-text",
                )}
                aria-pressed={framework === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <pre className="overflow-x-auto p-5 text-left font-mono text-[12px] leading-relaxed text-zt-muted sm:text-[13px]">
              <code>{snippet}</code>
            </pre>
            <button
              type="button"
              onClick={() => void copy(snippet, "snippet")}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-lg border border-zt-border bg-[#070d18]/90 px-2.5 py-1.5 text-xs text-zt-muted hover:text-zt-text"
              aria-label="Copy code snippet"
            >
              {copied === "snippet" ? (
                <Check className="size-3.5 text-zt-success" />
              ) : (
                <Copy className="size-3.5" />
              )}
              Copy
            </button>
          </div>
        </div>
      </Reveal>
    </LandingSection>
  );
}
