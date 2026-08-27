"use client";

import { useDictionary } from "@/components/i18n/locale-provider";
import type { SeriesPoint } from "@/services/admin/analytics-intelligence.types";

const SERIES_META = [
  { key: "activeUsers" as const, color: "#67e8f9", labelKey: "activeUsers" as const },
  { key: "newUsers" as const, color: "#34d399", labelKey: "newUsers" as const },
  { key: "apiEvents" as const, color: "#fbbf24", labelKey: "api" as const },
  { key: "aiRequests" as const, color: "#a78bfa", labelKey: "ai" as const },
  { key: "errors" as const, color: "#f87171", labelKey: "errors" as const },
  { key: "heartbeats" as const, color: "#60a5fa", labelKey: "heartbeats" as const },
];

export function MultiSeriesChart({
  data,
  title,
}: {
  data: SeriesPoint[];
  title: string;
}) {
  const { dict } = useDictionary();
  const seriesLabels = dict.admin.analytics.series;
  const series = SERIES_META.map((item) => ({
    ...item,
    label: seriesLabels[item.labelKey],
  }));

  const width = 720;
  const height = 180;
  const pad = { top: 12, right: 8, bottom: 24, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(
    1,
    ...data.flatMap((point) => series.map((s) => point[s.key])),
  );
  const x = (index: number) =>
    pad.left +
    (data.length <= 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
  const y = (value: number) => pad.top + innerH - (value / max) * innerH;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 text-[10px] text-[var(--admin-muted)]">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: s.color }}
              aria-hidden
            />
            {s.label}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-full"
        role="img"
        aria-label={title}
      >
        {series.map((s) => {
          const path = data
            .map((point, index) => {
              const command = index === 0 ? "M" : "L";
              return `${command}${x(index)} ${y(point[s.key])}`;
            })
            .join(" ");
          return (
            <path
              key={s.key}
              d={path}
              fill="none"
              stroke={s.color}
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}

export function BarTrend({
  points,
  color,
  label,
}: {
  points: { label: string; value: number }[];
  color: string;
  label: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div
      className="flex h-16 items-end gap-0.5"
      role="img"
      aria-label={label}
    >
      {points.map((point) => (
        <div
          key={point.label}
          className="flex-1 rounded-t-sm"
          style={{
            height: `${Math.max(4, (point.value / max) * 100)}%`,
            background: color,
            opacity: 0.85,
          }}
          title={`${point.label}: ${point.value}`}
        />
      ))}
    </div>
  );
}
