"use client";

import {
  Activity,
  AlertTriangle,
  Bell,
  Bug,
  ChevronRight,
  CircleCheck,
  GitCommitHorizontal,
  Info,
  Lightbulb,
  Link2,
  Rocket,
  Siren,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";
import type {
  BadgeTone,
  Correlation,
  Insight,
  ProjectIntelligence,
  Recommendation,
  TimelineEvent,
  TimelineKind,
} from "@/services/intelligence/types";

const severityToTone: Record<Insight["severity"], BadgeTone> = {
  positive: "success",
  info: "primary",
  warning: "warning",
  critical: "danger",
};

const severityIcon: Record<Insight["severity"], LucideIcon> = {
  positive: CircleCheck,
  info: Info,
  warning: AlertTriangle,
  critical: Siren,
};

const timelineIcon: Record<TimelineKind, LucideIcon> = {
  deployment: Rocket,
  error: Bug,
  incident: Siren,
  ai: Sparkles,
  heartbeat: Activity,
  performance: TrendingUp,
  notification: Bell,
};

function priorityTone(priority: Recommendation["priority"]): BadgeProps["tone"] {
  if (priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "default";
}

function timelineToneClass(tone: BadgeTone): string {
  switch (tone) {
    case "danger":
      return "bg-zt-danger/15 text-zt-danger";
    case "warning":
      return "bg-zt-warning/15 text-zt-warning";
    case "success":
      return "bg-zt-success/15 text-zt-success";
    case "primary":
      return "bg-zt-primary/15 text-zt-primary";
    default:
      return "bg-white/[0.05] text-zt-muted";
  }
}

export function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm text-zt-muted">{text}</p>;
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-zt-primary to-zt-purple"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-zt-muted">{value}%</span>
    </div>
  );
}

export function InsightRow({ insight }: { insight: Insight }) {
  const Icon = severityIcon[insight.severity];
  const tone = severityToTone[insight.severity];
  return (
    <div className="rounded-xl border border-zt-border bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
              tone === "danger"
                ? "bg-zt-danger/15 text-zt-danger"
                : tone === "warning"
                  ? "bg-zt-warning/15 text-zt-warning"
                  : tone === "success"
                    ? "bg-zt-success/15 text-zt-success"
                    : "bg-zt-primary/15 text-zt-primary",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-zt-text">{insight.title}</p>
            <p className="mt-0.5 text-xs text-zt-muted">{insight.detail}</p>
          </div>
        </div>
        <ConfidenceBar value={insight.confidence} />
      </div>
      {insight.evidence.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5 pl-11">
          {insight.evidence.map((e, i) => (
            <span
              key={`${insight.id}-ev-${i}`}
              className="rounded-md bg-white/[0.03] px-2 py-0.5 text-[11px] text-zt-muted"
            >
              {e}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function RecommendationRow({ rec }: { rec: Recommendation }) {
  return (
    <div className="rounded-xl border border-zt-border bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zt-text">{rec.title}</p>
        <Badge tone={priorityTone(rec.priority)}>{rec.priority}</Badge>
      </div>
      <p className="mt-1 text-xs text-zt-muted">{rec.detail}</p>
      <div className="mt-3 space-y-2 rounded-lg border border-zt-border/60 bg-white/[0.015] p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zt-muted">
            AI confidence
          </span>
          <ConfidenceBar value={rec.confidence} />
        </div>
        <p className="text-xs text-zt-muted">
          <span className="font-medium text-zt-text">Reasoning: </span>
          {rec.reasoning}
        </p>
        {rec.evidence.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {rec.evidence.map((e, i) => (
              <span
                key={`${rec.id}-ev-${i}`}
                className="rounded-md bg-white/[0.03] px-2 py-0.5 text-[11px] text-zt-muted"
              >
                {e}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CorrelationRow({ correlation }: { correlation: Correlation }) {
  return (
    <div className="rounded-xl border border-zt-border bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zt-secondary/15 text-zt-secondary">
            <Link2 className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-zt-text">
              {correlation.title}
            </p>
            <p className="mt-0.5 text-xs text-zt-muted">
              {correlation.relationship}
            </p>
          </div>
        </div>
        <ConfidenceBar value={correlation.confidence} />
      </div>
      <div className="mt-3 pl-11">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zt-muted">
          Root event:{" "}
          <span className="text-zt-text">{correlation.rootEvent}</span>
        </p>
        <ol className="space-y-1.5 border-l border-zt-border pl-4">
          {correlation.events.map((ev, i) => (
            <li key={`${correlation.id}-ev-${i}`} className="relative text-xs text-zt-muted">
              <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-zt-secondary" />
              <span className="text-zt-text">
                {formatRelativeTime(ev.at)}
              </span>{" "}
              — {ev.label}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function TimelineRow({ event }: { event: TimelineEvent }) {
  const Icon = timelineIcon[event.kind];
  return (
    <li className="flex items-start gap-3 py-2">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          timelineToneClass(event.tone),
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm text-zt-text">{event.title}</p>
          <time className="shrink-0 text-xs text-zt-muted">
            {formatRelativeTime(event.at)}
          </time>
        </div>
        {event.detail ? (
          <p className="text-xs text-zt-muted">{event.detail}</p>
        ) : null}
      </div>
    </li>
  );
}

function ReportCard({
  icon: Icon,
  label,
  items,
}: {
  icon: LucideIcon;
  label: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-zt-border bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4 text-zt-primary" aria-hidden />
        <p className="text-xs font-medium uppercase tracking-wide text-zt-muted">
          {label}
        </p>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li
            key={`${label}-${i}`}
            className="flex items-start gap-1.5 text-sm text-zt-text"
          >
            <ChevronRight
              className="mt-0.5 size-3.5 shrink-0 text-zt-muted"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WeeklyReportView({
  report,
}: {
  report: ProjectIntelligence["summaries"]["weekly"];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-zt-text">{report.summary}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ReportCard
          icon={Bug}
          label="Most common errors"
          items={report.mostCommonErrors}
        />
        <ReportCard
          icon={GitCommitHorizontal}
          label="Most unstable endpoint"
          items={[report.mostUnstableEndpoint]}
        />
        <ReportCard
          icon={TrendingUp}
          label="Best performing service"
          items={[report.bestPerformingService]}
        />
        <ReportCard
          icon={TrendingDown}
          label="Biggest improvement"
          items={[report.biggestImprovement]}
        />
        <ReportCard
          icon={AlertTriangle}
          label="Highest risk"
          items={[report.highestRisk]}
        />
        <ReportCard
          icon={Lightbulb}
          label="Recommendations"
          items={report.recommendations}
        />
      </div>
    </div>
  );
}
