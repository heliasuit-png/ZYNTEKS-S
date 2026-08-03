"use client";

import { Quote } from "lucide-react";

import { TESTIMONIALS } from "@/features/landing/data/content";
import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";

export function LandingTestimonials() {
  return (
    <LandingSection
      id="testimonials"
      eyebrow="Outcomes"
      title="What teams get with ZYNTEKSIS"
      description="Concrete outcomes the platform is designed to deliver — not fabricated customer quotes."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((item, index) => (
          <Reveal key={item.name + index} delay={index * 0.06}>
            <figure className="flex h-full flex-col rounded-2xl border border-zt-border bg-white/[0.02] p-6">
              <Quote className="size-5 text-zt-primary/70" aria-hidden />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-zt-muted">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-6 border-t border-zt-border pt-4">
                <p className="text-sm font-medium text-zt-text">{item.name}</p>
                <p className="text-xs text-zt-muted">
                  {item.role} · {item.company}
                </p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </LandingSection>
  );
}
