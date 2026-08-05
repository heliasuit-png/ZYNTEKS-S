"use client";

import type { AnalyticsIntelligenceData } from "@/services/admin/analytics-intelligence.types";

export function AnalyticsMap({
  geography,
}: {
  geography: AnalyticsIntelligenceData["geography"];
}) {
  const max = Math.max(1, ...geography.countries.map((c) => c.sessions));

  return (
    <section className="admin-glass admin-panel relative overflow-hidden rounded-2xl p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
      <div className="relative mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">
            Geographic analytics
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">
            {geography.cityNote}
          </p>
        </div>
      </div>
      <div className="relative grid gap-4 lg:grid-cols-[1fr_200px]">
        <svg
          viewBox="0 0 100 70"
          className="h-56 w-full rounded-xl border border-[var(--admin-border)] bg-[rgba(4,12,24,0.65)]"
          role="img"
          aria-label="World analytics map"
        >
          <ellipse
            cx="50"
            cy="35"
            rx="46"
            ry="28"
            fill="rgba(59,130,246,0.08)"
          />
          {geography.countries.map((country) => {
            const r = 0.8 + (country.sessions / max) * 2.8;
            return (
              <g key={country.country}>
                <circle
                  cx={country.x}
                  cy={country.y * 0.7}
                  r={r}
                  fill="rgba(96,165,250,0.85)"
                >
                  <title>
                    {country.country}: {country.sessions} sessions ·{" "}
                    {country.users} users
                  </title>
                </circle>
              </g>
            );
          })}
          {geography.countries.length === 0 ? (
            <text
              x="50"
              y="36"
              textAnchor="middle"
              fill="rgba(148,163,184,0.8)"
              fontSize="3.2"
            >
              No country session data
            </text>
          ) : null}
        </svg>
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            Top regions
          </p>
          {geography.regions.map((region) => (
            <div
              key={region.label}
              className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-xs"
            >
              <span className="text-[var(--admin-text)]">{region.label}</span>
              <span className="text-[var(--admin-accent-text)]">
                {region.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
