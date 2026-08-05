"use client";

import type { SeriesPoint } from "@/services/admin/analytics-intelligence.types";

const SERIES = [
  { key: "activeUsers" as const, label: "Active users", color: "#67e8f9" },
  { key: "newUsers" as const, label: "New users", color: "#34d399" },
  { key: "apiEvents" as const, label: "API", color: "#fbbf24" },
  { key: "aiRequests" as const, label: "AI", color: "#a78bfa" },
  { key: "errors" as const, label: "Errors", color: "#f87171" },
  { key: "heartbeats" as const, label: "Heartbeats", color: "#60a5fa" },
];

export function MultiSeriesChart({
  data,
  title,
}: {
  data: SeriesPoint[];
  title: string;
}) {
  const width = 720;
  const height = 220;
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(
    1,
    ...data.flatMap((point) => SERIES.map((series) => point[series.key])),
  );
  const x = (index: number) =>
    pad.left +
    (data.length <= 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
  const y = (value: number) => pad.top + innerH - (value / max) * innerH;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 text-[10px] text-[var(--admin-muted)]">
        {SERIES.map((series) => (
          <span key={series.key} className="inline-flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: series.color }}
            />
            {series.label}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={title}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const yy = pad.top + innerH * (1 - tick);
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={yy}
                y2={yy}
                stroke="rgba(255,255,255,0.06)"
              />
              <text
                x={pad.left - 8}
                y={yy + 3}
                textAnchor="end"
                fill="rgba(139,151,168,0.9)"
                fontSize="10"
              >
                {Math.round(max * tick)}
              </text>
            </g>
          );
        })}
        {SERIES.map((series) => {
          const d = data
            .map(
              (point, index) =>
                `${index === 0 ? "M" : "L"} ${x(index)} ${y(point[series.key])}`,
            )
            .join(" ");
          return (
            <path
              key={series.key}
              d={d}
              fill="none"
              stroke={series.color}
              strokeWidth="1.75"
              opacity={0.9}
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
          className="min-w-0 flex-1 rounded-t-sm"
          style={{
            height: `${Math.max(4, (point.value / max) * 100)}%`,
            background: color,
            opacity: point.value === 0 ? 0.2 : 0.9,
          }}
          title={`${point.label}: ${point.value}`}
        />
      ))}
    </div>
  );
}
