"use client";

import { HOW_IT_WORKS } from "@/features/landing/data/content";
import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";

export function LandingHowItWorks() {
  return (
    <LandingSection
      id="how-it-works"
      eyebrow="How it works"
      title="Live in three steps"
      description="From empty workspace to streaming telemetry without a complicated onboarding maze."
      narrow
    >
      <ol className="relative mx-auto max-w-2xl space-y-0">
        <div
          aria-hidden
          className="absolute top-3 bottom-3 left-[1.15rem] w-px bg-gradient-to-b from-zt-primary via-zt-secondary to-transparent sm:left-[1.35rem]"
        />
        {HOW_IT_WORKS.map((item, index) => (
          <Reveal key={item.step} delay={index * 0.08}>
            <li className="relative flex gap-5 pb-10 last:pb-0 sm:gap-6">
              <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-zt-primary/40 bg-[#07111f] font-[family-name:var(--font-landing-display)] text-sm font-semibold text-zt-primary sm:size-11 sm:text-base">
                {item.step}
              </span>
              <div className="pt-0.5">
                <h3 className="font-[family-name:var(--font-landing-display)] text-xl font-semibold text-zt-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zt-muted sm:text-base">
                  {item.description}
                </p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </LandingSection>
  );
}
