"use client";

import { Activity, Gauge, Siren } from "lucide-react";

import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";

const ITEMS = [
  {
    icon: Activity,
    title: "Error monitoring",
    text: "Group, fingerprint, and explore stack traces with environment and release context.",
  },
  {
    icon: Gauge,
    title: "Health & uptime",
    text: "Endpoint checks, latency windows, and clear timelines for every critical path.",
  },
  {
    icon: Siren,
    title: "Incident management",
    text: "Track severity, status, and updates so on-call stays aligned with customers.",
  },
] as const;

export function LandingMonitoring() {
  return (
    <LandingSection
      id="monitoring"
      eyebrow="Monitoring"
      title="See failures before your users do"
      description="Errors, health, and incidents share one narrative — so debugging starts with signal, not noise."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {ITEMS.map((item, index) => {
          const Icon = item.icon;
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
