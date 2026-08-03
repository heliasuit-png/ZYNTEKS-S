"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";

const W = 800;
const H = 360;

// Ambient node positions (abstract continents). Decorative only.
const nodes: Array<{ x: number; y: number; size: number }> = [
  { x: 150, y: 130, size: 3 },
  { x: 210, y: 180, size: 2 },
  { x: 380, y: 110, size: 3 },
  { x: 420, y: 170, size: 2 },
  { x: 470, y: 220, size: 2 },
  { x: 560, y: 140, size: 3 },
  { x: 620, y: 210, size: 2 },
  { x: 300, y: 250, size: 2 },
  { x: 680, y: 120, size: 2 },
];

const links: Array<[number, number]> = [
  [0, 2],
  [2, 5],
  [5, 8],
  [3, 6],
  [2, 4],
  [0, 7],
];

function arc(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const cx = (a.x + b.x) / 2;
  const cy = Math.min(a.y, b.y) - 46;
  return `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`;
}

export function WorldMap() {
  return (
    <Panel className="overflow-hidden">
      <PanelHeader>
        <PanelTitle>
          <span className="flex items-center gap-2">
            <Globe className="size-4 text-zt-primary" aria-hidden />
            Global Activity
          </span>
        </PanelTitle>
        <span className="rounded-full border border-zt-border bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-medium text-zt-muted">
          Preview
        </span>
      </PanelHeader>
      <PanelContent className="p-0">
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label="Ambient global activity map"
          >
            <defs>
              <radialGradient id="wm-glow" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#4f8cff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#06080e" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="wm-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4f8cff" stopOpacity="0" />
                <stop offset="50%" stopColor="#4f8cff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#2ce6d1" stopOpacity="0" />
              </linearGradient>
            </defs>

            <rect width={W} height={H} fill="url(#wm-glow)" />

            {/* Graticule */}
            <g stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none">
              {[80, 140, 200, 260].map((y) => (
                <line key={`h${y}`} x1="40" y1={y} x2={W - 40} y2={y} />
              ))}
              {[160, 320, 480, 640].map((x) => (
                <line key={`v${x}`} x1={x} y1="50" x2={x} y2={H - 50} />
              ))}
            </g>

            {/* Connection arcs with a travelling pulse */}
            {links.map(([a, b], i) => {
              const na = nodes[a]!;
              const nb = nodes[b]!;
              const d = arc(na, nb);
              return (
                <g key={`l${i}`}>
                  <path
                    d={d}
                    fill="none"
                    stroke="rgba(79,140,255,0.18)"
                    strokeWidth="1.2"
                  />
                  <motion.path
                    d={d}
                    fill="none"
                    stroke="url(#wm-line)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeDasharray="26 400"
                    initial={{ strokeDashoffset: 426 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{
                      duration: 3.4,
                      repeat: Infinity,
                      ease: "linear",
                      delay: i * 0.6,
                    }}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((n, i) => (
              <g key={`n${i}`}>
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={n.size + 6}
                  fill="#4f8cff"
                  initial={{ opacity: 0.35, scale: 0.6 }}
                  animate={{ opacity: [0.35, 0, 0.35], scale: [0.6, 1.8, 0.6] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: (i % 4) * 0.4,
                  }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.size}
                  fill="#2ce6d1"
                  className="drop-shadow-[0_0_6px_rgba(44,230,209,0.8)]"
                />
              </g>
            ))}
          </svg>
          <p className="px-5 pb-4 pt-1 text-xs text-zt-muted">
            Realtime visitor locations will appear here once analytics are
            connected.
          </p>
        </div>
      </PanelContent>
    </Panel>
  );
}
