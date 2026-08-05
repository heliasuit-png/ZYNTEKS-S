"use client";

import type { MonitoringMissionData } from "@/services/admin/monitoring-mission.types";

export function WorldMap({
  geography,
}: {
  geography: MonitoringMissionData["geography"];
}) {
  const max = Math.max(1, ...geography.countries.map((c) => c.sessions));

  return (
    <section className="admin-glass admin-panel relative overflow-hidden rounded-2xl p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
      <div className="relative mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">
            World map
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">
            {geography.requestProxyNote}
          </p>
        </div>
        <p className="text-[10px] text-[var(--admin-accent-text)]">
          {geography.cityNote}
        </p>
      </div>

      <div className="relative grid gap-4 lg:grid-cols-[1fr_220px]">
        <svg
          viewBox="0 0 100 70"
          className="h-56 w-full rounded-xl border border-[var(--admin-border)] bg-[rgba(4,12,24,0.65)]"
          role="img"
          aria-label="World activity map by country sessions"
        >
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.35)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0)" />
            </radialGradient>
          </defs>
          <ellipse cx="50" cy="35" rx="46" ry="28" fill="url(#mapGlow)" />
          <path
            d="M8 20 C20 12, 35 14, 48 18 C60 14, 72 12, 88 20 C92 34, 90 48, 82 58 C68 64, 52 62, 40 58 C28 62, 16 56, 10 42 Z"
            fill="none"
            stroke="rgba(147,197,253,0.18)"
            strokeWidth="0.4"
          />
          {geography.countries.map((country) => {
            const r = 0.8 + (country.sessions / max) * 2.8;
            return (
              <g key={country.country}>
                <circle
                  cx={country.x}
                  cy={country.y * 0.7}
                  r={r + 1.2}
                  fill="rgba(59,130,246,0.12)"
                >
                  <animate
                    attributeName="r"
                    values={`${r + 0.6};${r + 1.8};${r + 0.6}`}
                    dur="2.8s"
                    repeatCount="indefinite"
                  />
                </circle>
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
              No country session data in range
            </text>
          ) : null}
        </svg>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            Top regions
          </p>
          {geography.topRegions.length === 0 ? (
            <p className="text-xs text-[var(--admin-muted)]">No regions yet.</p>
          ) : (
            geography.topRegions.map((region) => (
              <div
                key={region.label}
                className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2.5 py-1.5 text-xs"
              >
                <span className="text-[var(--admin-text)]">{region.label}</span>
                <span className="text-[var(--admin-accent-text)]">
                  {region.sessions.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
