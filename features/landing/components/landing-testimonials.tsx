"use client";

import { Quote } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { getTestimonials } from "@/features/landing/data/content";
import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";

export function LandingTestimonials() {
  const { dict } = useDictionary();
  const copy = dict.landing.testimonials;
  const items = getTestimonials(dict);

  return (
    <LandingSection
      id="testimonials"
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.desc}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
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
