"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Boxes,
  Bug,
  Database,
  Gauge,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AiInfinity } from "@/components/dashboard/home/ai-infinity";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import type { DashboardStats, HealthState } from "@/types/dashboard";

interface StatusPill {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "accent";
}

interface CoreAction {
  intent: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  from: string;
  to: string;
}

const ACTIONS: CoreAction[] = [
  {
    intent: "analyze-project",
    title: "Analyze Project",
    desc: "Full health analysis",
    icon: Sparkles,
    from: "#3b82f6",
    to: "#7c3aed",
  },
  {
    intent: "analyze-error",
    title: "Analyze Error",
    desc: "Root-cause an incident",
    icon: Bug,
    from: "#ff3b5c",
    to: "#ffb020",
  },
  {
    intent: "review-architecture",
    title: "Review Architecture",
    desc: "Structure & scalability",
    icon: Boxes,
    from: "#7c3aed",
    to: "#ff4fd8",
  },
  {
    intent: "security-scan",
    title: "Security Review",
    desc: "Keys & auth signals",
    icon: ShieldCheck,
    from: "#00e5ff",
    to: "#3b82f6",
  },
  {
    intent: "performance-audit",
    title: "Performance Audit",
    desc: "Latency & Web Vitals",
    icon: Gauge,
    from: "#00ff88",
    to: "#00e5ff",
  },
  {
    intent: "database-review",
    title: "Data Path Review",
    desc: "Errors & hot paths",
    icon: Database,
    from: "#ffb020",
    to: "#ff3b5c",
  },
  {
    intent: "deployment-review",
    title: "Deployment Review",
    desc: "Release readiness",
    icon: Rocket,
    from: "#3b82f6",
    to: "#00e5ff",
  },
];

const toneClasses: Record<StatusPill["tone"], string> = {
  success: "text-zt-success",
  warning: "text-zt-warning",
  danger: "text-zt-danger",
  accent: "text-zt-accent",
};

const toneDot: Record<StatusPill["tone"], string> = {
  success: "bg-zt-success shadow-[0_0_10px_var(--color-zt-success)]",
  warning: "bg-zt-warning shadow-[0_0_10px_var(--color-zt-warning)]",
  danger: "bg-zt-danger shadow-[0_0_10px_var(--color-zt-danger)]",
  accent: "bg-zt-accent shadow-[0_0_10px_var(--color-zt-accent)]",
};

export function AiCore({
  stats,
  overall,
}: {
  stats: DashboardStats;
  overall: HealthState;
}) {
  const [nextAnalysis, setNextAnalysis] = useState("");

  useEffect(() => {
    const next = new Date(Date.now() + 5 * 60 * 1000);
    setNextAnalysis(
      next.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );
  }, []);

  const healthy = overall === "operational" && stats.errorsToday === 0;

  const pills: StatusPill[] = [
    { label: "AI", value: "Ready", tone: "success" },
    {
      label: "Monitoring",
      value: overall === "down" ? "Disrupted" : "Active",
      tone: overall === "operational" ? "success" : overall === "degraded" ? "warning" : "danger",
    },
    {
      label: "Infrastructure",
      value: healthy ? "Healthy" : overall === "down" ? "Critical" : "Watch",
      tone: healthy ? "success" : overall === "down" ? "danger" : "warning",
    },
    {
      label: "Next analysis",
      value: nextAnalysis ? `~ ${nextAnalysis}` : "scheduled",
      tone: "accent",
    },
  ];

  return (
    <section
      className="zt-card zt-gradient-border relative overflow-hidden rounded-3xl p-6 sm:p-10"
      aria-label="AI Core"
    >
      {/* Backdrop glows */}
      <div
        aria-hidden
        className="zt-glow-pulse pointer-events-none absolute left-1/2 top-0 size-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-gradient-to-b from-zt-primary/25 via-zt-secondary/15 to-transparent blur-3xl"
      />

      <div className="relative flex flex-col items-center text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-zt-border bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-zt-muted">
          <Sparkles className="size-3.5 text-zt-accent" aria-hidden />
          AI Core
        </span>

        <AiInfinity size={280} className="mb-2" />

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          <span className="bg-gradient-to-r from-zt-accent via-white to-zt-secondary bg-clip-text text-transparent">
            Intelligence, always on
          </span>
        </motion.h2>

        {/* Animated typing indicator */}
        <div className="mt-2 flex items-center gap-2 text-sm text-zt-muted">
          <span>Analyzing live telemetry</span>
          <span className="flex items-end gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full bg-zt-accent"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.18,
                }}
              />
            ))}
          </span>
        </div>

        {/* AI status pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {pills.map((pill) => (
            <span
              key={pill.label}
              className="zt-glass inline-flex items-center gap-2 rounded-full border border-zt-border px-3.5 py-1.5 text-xs"
            >
              <span
                className={cn("size-2 rounded-full", toneDot[pill.tone])}
                aria-hidden
              />
              <span className="text-zt-muted">{pill.label}</span>
              <span className={cn("font-semibold", toneClasses[pill.tone])}>
                {pill.value}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* AI action cards */}
      <div className="relative mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.intent}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.05 + index * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={`${DASHBOARD_ROUTES.aiAssistant}?intent=${action.intent}`}
                className="zt-hover-lift group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-zt-border bg-white/[0.02] p-4 transition-colors hover:border-zt-border-strong"
              >
                {/* Hover glow wash */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{
                    background: `radial-gradient(circle, ${action.to}, transparent 70%)`,
                  }}
                />
                <div className="flex items-center justify-between">
                  <span
                    className="flex size-11 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${action.from}, ${action.to})`,
                      boxShadow: `0 8px 24px -8px ${action.to}`,
                    }}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <ArrowUpRight className="size-4 text-zt-muted opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zt-text">
                    {action.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zt-muted">{action.desc}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
