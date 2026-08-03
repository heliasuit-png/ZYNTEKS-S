"use client";

import {
  Activity,
  Bell,
  Folders,
  Globe2,
  HeartPulse,
  KeyRound,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { FEATURES } from "@/features/landing/data/content";
import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";

const ICONS: Record<string, LucideIcon> = {
  Activity,
  Sparkles,
  Folders,
  KeyRound,
  HeartPulse,
  Bell,
  Globe2,
};

export function LandingFeatures() {
  return (
    <LandingSection
      id="features"
      eyebrow="Features"
      title="Everything your production stack needs"
      description="Monitoring, AI analysis, projects, keys, health, notifications, and status pages — one coherent operations surface."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => {
          const Icon = ICONS[feature.icon] ?? Activity;
          return (
            <Reveal key={feature.id} delay={index * 0.05}>
              <article className="group h-full rounded-2xl border border-zt-border bg-white/[0.02] p-6 transition-colors hover:border-zt-primary/35 hover:bg-white/[0.035]">
                <span className="flex size-11 items-center justify-center rounded-xl bg-zt-primary/12 text-zt-primary transition-transform group-hover:-translate-y-0.5">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-landing-display)] text-lg font-semibold text-zt-text">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zt-muted">
                  {feature.description}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </LandingSection>
  );
}
