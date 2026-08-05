"use client";

import type { UsageSeriesPoint } from "@/services/admin/executive-dashboard.types";

const SERIES = [
  { key: "users" as const, label: "Users", color: "#60a5fa" },
  { key: "errors" as const, label: "Errors", color: "#f87171" },
  { key: "aiRequests" as const, label: "AI", color: "#a78bfa" },
  { key: "projects" as const, label: "Projects", color: "#34d399" },
  { key: "apiCalls" as const, label: "API Calls", color: "#fbbf24" },
];

interface UsageChartProps {
  data: UsageSeriesPoint[];
}

export function UsageChart({ data }: UsageChartProps) {
  const width = 720;
  const height = 220;
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(
    1,
    ...data.flatMap((point) =>
      SERIES.map((series) => point[series.key]),
    ),
  );

  const x = (index: number) =>
    pad.left + (data.length <= 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
  const y = (value: number) =>
    pad.top + innerH - (value / max) * innerH;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs text-[var(--admin-muted)]">
        {SERIES.map((series) => (
          <span key={series.key} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: series.color }}
              aria-hidden
            />
            {series.label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-full"
          role="img"
          aria-label="Usage chart over the selected range"
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
            const path = data
              .map((point, index) => {
                const command = index === 0 ? "M" : "L";
                return `${command}${x(index)} ${y(point[series.key])}`;
              })
              .join(" ");
            return (
              <path
                key={series.key}
                d={path}
                fill="none"
                stroke={series.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })}

          {data.map((point, index) => {
            const show =
              data.length <= 12 ||
              index === 0 ||
              index === data.length - 1 ||
              index % Math.ceil(data.length / 6) === 0;
            if (!show) return null;
            return (
              <text
                key={point.label}
                x={x(index)}
                y={height - 8}
                textAnchor="middle"
                fill="rgba(139,151,168,0.9)"
                fontSize="10"
              >
                {point.label.length > 10
                  ? point.label.slice(5)
                  : point.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
