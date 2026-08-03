"use client";

import { Bot, MessageSquareText, ShieldCheck } from "lucide-react";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";

const POINTS = [
  {
    icon: MessageSquareText,
    title: "Conversation history",
    text: "Keep operational context across threads with pinned and project-scoped chats.",
  },
  {
    icon: ShieldCheck,
    title: "Plan-aware usage",
    text: "Monthly limits follow your subscription so AI stays predictable in production.",
  },
  {
    icon: Bot,
    title: "Streaming responses",
    text: "Prefer streaming or buffered replies from AI settings — your choice.",
  },
] as const;

export function LandingAi() {
  return (
    <LandingSection
      id="ai"
      eyebrow="AI Assistant"
      title="Ask your stack what just broke"
      description="An in-product assistant that understands projects, incidents, and monitoring context — not a generic chatbot bolted on the side."
    >
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <Reveal>
          <div className="space-y-4">
            {POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <div
                  key={point.title}
                  className="flex gap-4 rounded-2xl border border-zt-border bg-white/[0.02] p-4"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zt-primary/12 text-zt-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-medium text-zt-text">{point.title}</h3>
                    <p className="mt-1 text-sm text-zt-muted">{point.text}</p>
                  </div>
                </div>
              );
            })}
            <a
              href={DASHBOARD_ROUTES.aiAssistant}
              className="inline-flex text-sm font-medium text-zt-primary hover:underline"
            >
              Open AI Assistant after sign-in →
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-zt-border bg-[#08101c] shadow-[0_30px_80px_-40px_rgba(0,229,255,0.35)]">
            <div className="border-b border-white/8 px-4 py-3 text-xs text-zt-muted">
              AI · Project context
            </div>
            <div className="space-y-3 p-5 text-sm">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-zt-primary/15 px-4 py-3 text-zt-text">
                Why did checkout latency spike after release 1.8.2?
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-white/8 bg-white/[0.03] px-4 py-3 text-zt-muted">
                Error group{" "}
                <span className="text-zt-text">TimeoutError</span> climbed 4× on
                the payments service. Health checks show elevated p95 on{" "}
                <span className="text-zt-text">/api/charge</span>. Related
                incident is still investigating.
              </div>
              <div className="flex gap-1 pt-2">
                <span className="size-1.5 animate-pulse rounded-full bg-zt-primary" />
                <span className="size-1.5 animate-pulse rounded-full bg-zt-primary [animation-delay:120ms]" />
                <span className="size-1.5 animate-pulse rounded-full bg-zt-primary [animation-delay:240ms]" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </LandingSection>
  );
}
