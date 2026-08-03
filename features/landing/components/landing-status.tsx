"use client";

import { CheckCircle2, Clock3, Megaphone } from "lucide-react";

import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";

export function LandingStatus() {
  return (
    <LandingSection
      id="status-pages"
      eyebrow="Status Pages"
      title="Keep customers informed without a second product"
      description="Publish branded public pages with component health, incident history, and uptime windows."
    >
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <Reveal>
          <ul className="space-y-4">
            {[
              {
                icon: CheckCircle2,
                title: "Component health",
                text: "Show API, dashboard, and third-party systems in one glance.",
              },
              {
                icon: Megaphone,
                title: "Incident updates",
                text: "Post investigating → resolved updates that match your internal timeline.",
              },
              {
                icon: Clock3,
                title: "Uptime windows",
                text: "Share 24h, 7d, 30d, and 90d availability without exporting spreadsheets.",
              },
            ].map((item) => {
              const Icon = item.icon;
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
                status.yourproduct.com
              </p>
              <span className="rounded-full bg-zt-success/15 px-2.5 py-1 text-xs text-zt-success">
                All systems operational
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {["API", "Dashboard", "Notifications", "Status page"].map(
                (name, index) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-xl border border-white/8 px-3 py-2.5 text-sm"
                  >
                    <span className="text-zt-text">{name}</span>
                    <span className="text-zt-success">
                      {index === 2 ? "Degraded" : "Operational"}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </LandingSection>
  );
}
