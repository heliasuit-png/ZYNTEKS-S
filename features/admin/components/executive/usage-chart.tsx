"use client";

import { useDictionary } from "@/components/i18n/locale-provider";
import type { UsageSeriesPoint } from "@/services/admin/executive-dashboard.types";

const SERIES_META = [
  { key: "users" as const, color: "#60a5fa", labelKey: "users" as const },
  { key: "errors" as const, color: "#f87171", labelKey: "errors" as const },
  { key: "aiRequests" as const, color: "#a78bfa", labelKey: "ai" as const },
  { key: "projects" as const, color: "#34d399", labelKey: "projects" as const },
  { key: "apiCalls" as const, color: "#fbbf24", labelKey: "apiCalls" as const },
];

interface UsageChartProps {
  data: UsageSeriesPoint[];
}

export function UsageChart({ data }: UsageChartProps) {
  const { dict } = useDictionary();
  const t = dict.admin.executive.chart;

  const series = SERIES_META.map((item) => ({
    ...item,
    label: t[item.labelKey],
  }));

  const width = 720;
  const height = 220;
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(
    1,
    ...data.flatMap((point) => series.map((s) => point[s.key])),
  );

  const x = (index: number) =>
    pad.left + (data.length <= 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
  const y = (value: number) => pad.top + innerH - (value / max) * innerH;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs text-[var(--admin-muted)]">
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
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-full"
          role="img"
          aria-label={t.ariaLabel}
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
                {point.label.length > 10 ? point.label.slice(5) : point.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
