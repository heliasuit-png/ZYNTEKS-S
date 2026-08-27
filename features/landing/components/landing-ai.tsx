"use client";

import { Bot, MessageSquareText, ShieldCheck } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";

const POINT_ICONS = [MessageSquareText, ShieldCheck, Bot] as const;

export function LandingAi() {
  const { dict } = useDictionary();
  const copy = dict.landing.ai;

  return (
    <LandingSection
      id="ai"
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.desc}
    >
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <Reveal>
          <div className="space-y-4">
            {copy.points.map((point, index) => {
              const Icon = POINT_ICONS[index] ?? Bot;
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
              {copy.cta}
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-zt-border bg-[#08101c] shadow-[0_30px_80px_-40px_rgba(0,229,255,0.35)]">
            <div className="border-b border-white/8 px-4 py-3 text-xs text-zt-muted">
              {copy.mockHeader}
            </div>
            <div className="space-y-3 p-5 text-sm">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-zt-primary/15 px-4 py-3 text-zt-text">
                {copy.mockUser}
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-white/8 bg-white/[0.03] px-4 py-3 text-zt-muted">
                {copy.mockAssistant}
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
