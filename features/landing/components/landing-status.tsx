"use client";

import { CheckCircle2, Clock3, Megaphone } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";

const ITEM_ICONS = [CheckCircle2, Megaphone, Clock3] as const;

export function LandingStatus() {
  const { dict } = useDictionary();
  const copy = dict.landing.status;
  const componentRows = [
    { name: copy.components.api, degraded: false },
    { name: copy.components.dashboard, degraded: false },
    { name: copy.components.notifications, degraded: true },
    { name: copy.components.statusPage, degraded: false },
  ] as const;

  return (
    <LandingSection
      id="status-pages"
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.desc}
    >
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <Reveal>
          <ul className="space-y-4">
            {copy.items.map((item, index) => {
              const Icon = ITEM_ICONS[index] ?? CheckCircle2;
              return (
                <li
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-zt-border bg-white/[0.02] p-4"
                >
                  <Icon className="mt-0.5 size-5 shrink-0 text-zt-success" aria-hidden />
                  <div>
                    <h3 className="font-medium text-zt-text">{item.title}</h3>
                    <p className="mt-1 text-sm text-zt-muted">{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-2xl border border-zt-border bg-[#08101c] p-5">
            <div className="flex items-center justify-between">
              <p className="font-[family-name:var(--font-landing-display)] text-lg font-semibold text-zt-text">
                {copy.demoHost}
              </p>
              <span className="rounded-full bg-zt-success/15 px-2.5 py-1 text-xs text-zt-success">
                {copy.allOperational}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {componentRows.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between rounded-xl border border-white/8 px-3 py-2.5 text-sm"
                >
                  <span className="text-zt-text">{row.name}</span>
                  <span className="text-zt-success">
                    {row.degraded ? copy.degraded : copy.operational}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </LandingSection>
  );
}
