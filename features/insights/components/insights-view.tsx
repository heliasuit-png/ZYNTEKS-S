"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  Lightbulb,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/dashboard/badge";
import type { BadgeProps } from "@/components/dashboard/badge";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { CircularProgress } from "@/components/dashboard/circular-progress";
import { CountUp, FadeIn } from "@/components/dashboard/motion";
import { MarkdownMessage } from "@/components/markdown/markdown-message";
import {
  CorrelationRow,
  EmptyLine,
  InsightRow,
  RecommendationRow,
  TimelineRow,
  WeeklyReportView,
} from "@/features/insights/components/insights-rows";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";
import type { BadgeTone, ProjectIntelligence } from "@/services/intelligence/types";

interface ProjectOption {
  id: string;
  name: string;
}

interface InsightsViewProps {
  projects: ProjectOption[];
  selectedId: string;
  data: ProjectIntelligence;
}

const toneToBadge: Record<BadgeTone, BadgeProps["tone"]> = {
  success: "success",
  warning: "warning",
  danger: "danger",
  primary: "primary",
  default: "default",
};

function scoreColor(value: number): string {
  if (value >= 85) return "text-zt-success";
  if (value >= 70) return "text-zt-warning";
  return "text-zt-danger";
}

function scoreBarColor(value: number): string {
  if (value >= 85) return "from-zt-success to-zt-primary";
  if (value >= 70) return "from-zt-warning to-zt-secondary";
  return "from-zt-danger to-zt-warning";
}

export function InsightsView({ projects, selectedId, data }: InsightsViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"executive" | "developer" | "weekly">(
    "executive",
  );

  const subScores = useMemo(
    () => [
      { label: "Reliability", value: data.scores.reliability },
      { label: "Availability", value: data.scores.availability },
      { label: "Performance", value: data.scores.performance },
      { label: "Security", value: data.scores.security },
      { label: "Maintainability", value: data.scores.maintainability },
    ],
    [data.scores],
  );

  const TrendIcon =
    data.trend.direction === "improving"
      ? TrendingDown
      : data.trend.direction === "degrading"
        ? TrendingUp
        : Activity;

  const trendTone: BadgeProps["tone"] =
    data.trend.direction === "improving"
      ? "success"
      : data.trend.direction === "degrading"
        ? "danger"
        : "default";

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex flex-wrap items-center gap-2"
            role="tablist"
            aria-label="Projects"
          >
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === selectedId}
                onClick={() =>
                  router.push(`${DASHBOARD_ROUTES.insights}?p=${p.id}`)
                }
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                  p.id === selectedId
                    ? "border-zt-primary/50 bg-gradient-to-r from-zt-primary/25 via-zt-secondary/15 to-transparent text-zt-text shadow-[0_0_20px_-6px_var(--color-zt-primary)]"
                    : "border-zt-border bg-white/[0.02] text-zt-muted hover:text-zt-text",
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.badges.map((b) => (
              <Badge key={b.label} tone={toneToBadge[b.tone]}>
                <BadgeCheck className="size-3.5" aria-hidden />
                {b.label}
              </Badge>
            ))}
            <button
              type="button"
              onClick={() => router.refresh()}
              className="flex items-center gap-1.5 rounded-full border border-zt-border bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-zt-muted transition-colors hover:text-zt-text"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Refresh
            </button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Project Health Engine</PanelTitle>
              <p className="mt-1 text-xs text-zt-muted">
                Computed {formatRelativeTime(data.generatedAt)} from recorded
                telemetry.
              </p>
            </div>
            <Badge tone={trendTone}>
              <TrendIcon className="size-3.5" aria-hidden />
              {data.trend.label}
            </Badge>
          </PanelHeader>
          <PanelContent className="flex flex-col items-center gap-8 lg:flex-row lg:items-center">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <CircularProgress value={data.scores.overall} size={168}>
                <span
                  className={cn(
                    "text-4xl font-semibold",
                    scoreColor(data.scores.overall),
                  )}
                >
                  <CountUp value={data.scores.overall} />
                </span>
                <span className="text-xs text-zt-muted">Overall health</span>
              </CircularProgress>
              <p className="text-xs text-zt-muted">
                vs {data.trend.comparedTo}
              </p>
            </div>
            <div className="grid w-full flex-1 gap-4 sm:grid-cols-2">
              {subScores.map((s) => (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zt-muted">{s.label}</span>
                    <span className={cn("font-semibold", scoreColor(s.value))}>
                      {s.value}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        scoreBarColor(s.value),
                      )}
                      style={{ width: `${s.value}%` }}
                      role="progressbar"
                      aria-valuenow={s.value}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${s.label} score`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </PanelContent>
        </Panel>
      </FadeIn>

      <div className="grid gap-6 xl:grid-cols-2">
        <FadeIn delay={0.1}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>Project insights</PanelTitle>
              <Badge tone="default">{data.insights.length}</Badge>
            </PanelHeader>
            <PanelContent className="space-y-3">
              {data.insights.length === 0 ? (
                <EmptyLine text="No insights yet — telemetry will populate this as it arrives." />
              ) : (
                data.insights.map((insight) => (
                  <InsightRow key={insight.id} insight={insight} />
                ))
              )}
            </PanelContent>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Panel className="h-full">
            <PanelHeader>
              <PanelTitle>AI recommendations</PanelTitle>
              <Badge tone="primary">
                <Lightbulb className="size-3.5" aria-hidden />
                {data.recommendations.length}
              </Badge>
            </PanelHeader>
            <PanelContent className="space-y-3">
              {data.recommendations.length === 0 ? (
                <EmptyLine text="No action required right now. Recommendations appear when the engine detects issues." />
              ) : (
                data.recommendations.map((rec) => (
                  <RecommendationRow key={rec.id} rec={rec} />
                ))
              )}
            </PanelContent>
          </Panel>
        </FadeIn>
      </div>

      <FadeIn delay={0.2}>
        <Panel>
          <PanelHeader>
            <PanelTitle>Smart correlation</PanelTitle>
            <Badge tone="default">{data.correlations.length}</Badge>
          </PanelHeader>
          <PanelContent className="space-y-4">
            {data.correlations.length === 0 ? (
              <EmptyLine text="No correlated event chains detected. The engine links errors, deployments, heartbeats and incidents when they align in time." />
            ) : (
              data.correlations.map((c) => (
                <CorrelationRow key={c.id} correlation={c} />
              ))
            )}
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.25}>
        <Panel>
          <PanelHeader>
            <PanelTitle>Smart timeline</PanelTitle>
            <Badge tone="default">{data.timeline.length} events</Badge>
          </PanelHeader>
          <PanelContent>
            {data.timeline.length === 0 ? (
              <EmptyLine text="No events recorded yet." />
            ) : (
              <ol className="relative space-y-1 pl-2">
                {data.timeline.map((event) => (
                  <TimelineRow key={event.id} event={event} />
                ))}
              </ol>
            )}
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.3}>
        <Panel>
          <PanelHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <PanelTitle>Summaries &amp; reports</PanelTitle>
            <div
              className="flex items-center gap-1 rounded-full border border-zt-border bg-white/[0.02] p-1"
              role="tablist"
              aria-label="Summary type"
            >
              {(["executive", "developer", "weekly"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium capitalize transition-all",
                    tab === key
                      ? "bg-gradient-to-r from-zt-primary to-zt-purple text-white shadow-[0_0_16px_-6px_var(--color-zt-primary)]"
                      : "text-zt-muted hover:text-zt-text",
                  )}
                >
                  {key === "weekly" ? "Weekly report" : key}
                </button>
              ))}
            </div>
          </PanelHeader>
          <PanelContent>
            {tab === "executive" ? (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zt-muted">
                  Executive summary — for managers
                </p>
                <p className="text-sm leading-relaxed text-zt-text">
                  {data.summaries.executive}
                </p>
              </div>
            ) : null}
            {tab === "developer" ? (
              <div>
                <MarkdownMessage content={data.summaries.developer} />
              </div>
            ) : null}
            {tab === "weekly" ? (
              <WeeklyReportView report={data.summaries.weekly} />
            ) : null}
          </PanelContent>
        </Panel>
      </FadeIn>
    </div>
  );
}
