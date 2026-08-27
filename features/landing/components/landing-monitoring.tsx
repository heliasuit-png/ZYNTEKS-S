"use client";

import { Activity, Gauge, Siren } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";

const ITEM_ICONS = [Activity, Gauge, Siren] as const;

export function LandingMonitoring() {
  const { dict } = useDictionary();
  const copy = dict.landing.monitoring;

  return (
    <LandingSection
      id="monitoring"
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.desc}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {copy.items.map((item, index) => {
          const Icon = ITEM_ICONS[index] ?? Activity;
          return (
            <Reveal key={item.title} delay={index * 0.06}>
              <article className="h-full rounded-2xl border border-zt-border bg-gradient-to-b from-white/[0.04] to-transparent p-6">
                <Icon className="size-6 text-zt-primary" aria-hidden />
                <h3 className="mt-4 font-[family-name:var(--font-landing-display)] text-lg font-semibold text-zt-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zt-muted">
                  {item.text}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </LandingSection>
  );
}
