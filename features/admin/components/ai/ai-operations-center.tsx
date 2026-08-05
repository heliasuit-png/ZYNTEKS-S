"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import type { AiOpsData } from "@/services/admin/ai-operations.types";
import { HealthDot } from "@/features/admin/components/executive/health-dot";
import {
  formatNumber,
  formatRelative,
} from "@/features/admin/components/executive/format";
import { AiOpsFilters } from "@/features/admin/components/ai/ai-ops-filters";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-header";
import { AdminEmptyState } from "@/features/admin/components/ui/admin-empty-state";
import { ADMIN_KPI_STAGGER } from "@/features/admin/components/ui/admin-motion";

function money(value: number | null): string {
  if (value == null) return "—";
  if (value < 0.01 && value > 0) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

function BarTrend({
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
    <div className="flex h-14 items-end gap-0.5" role="img" aria-label={label}>
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

export function AiOperationsCenter({ data }: { data: AiOpsData }) {
  const kpis = [
    {
      label: "Total AI requests",
      value: formatNumber(data.overview.totalRequests),
      hint: "ai_usage rows in range",
    },
    {
      label: "Requests today",
      value: formatNumber(data.overview.requestsToday),
      hint: "UTC day",
    },
    {
      label: "Successful requests",
      value: "—",
      hint: "Failures not stored",
    },
    {
      label: "Failed requests",
      value: "—",
      hint: "Not persisted",
    },
    {
      label: "Avg response time",
      value: "—",
      hint: "Latency not stored",
    },
    {
      label: "Average tokens",
      value:
        data.overview.averageTokens == null
          ? "—"
          : formatNumber(data.overview.averageTokens),
      hint: "total_tokens / requests",
    },
    {
      label: "Estimated AI cost",
      value: money(data.overview.estimatedCostUsd),
      hint: "Public list prices × tokens",
    },
    {
      label: "Most used model",
      value: data.overview.mostUsedModel ?? "—",
      hint: "By request count",
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Model operations"
        title="AI Operations Center"
        description={`Platform-wide AI usage, tokens, cost estimates, and health — from recorded completions only. Updated ${formatRelative(data.generatedAt)}.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {kpis.map((card, index) => (
          <motion.article
            key={card.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * ADMIN_KPI_STAGGER, duration: 0.22 }}
            className="admin-glass admin-panel rounded-2xl px-3 py-3"
          >
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              {card.label}
            </p>
            <p className="mt-1 truncate text-lg font-semibold text-[var(--admin-text)]">
              {card.value}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--admin-accent-text)]">
              {card.hint}
            </p>
          </motion.article>
        ))}
      </div>

      <AiOpsFilters options={data.filterOptions} />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Model analytics" subtitle="Usage mix · tokens · daily trend">
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {data.models.length === 0 ? (
              <AdminEmptyState title="No model usage in range." />
            ) : (
              data.models.map((model) => (
                <div
                  key={model.model}
                  className="rounded-xl border border-[var(--admin-border)] px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--admin-text)]">
                      {model.model}
                    </p>
                    <span className="text-xs text-[var(--admin-accent-text)]">
                      {model.usagePercent}% · {formatNumber(model.requests)} req
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--admin-muted)]">
                    {formatNumber(model.tokens)} tokens · prompt{" "}
                    {formatNumber(model.promptTokens)} · completion{" "}
                    {formatNumber(model.completionTokens)} · latency — · success
                    —
                  </p>
                  <div className="mt-2">
                    <BarTrend
                      points={model.dailyTrend.map((p) => ({
                        label: p.label,
                        value: p.requests,
                      }))}
                      color="#60a5fa"
                      label={`${model.model} daily`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Token analytics" subtitle="Input · output · consumers">
          <div className="mb-3 grid grid-cols-3 gap-2">
            <MiniStat
              label="Input tokens"
              value={formatNumber(data.tokens.inputTokens)}
            />
            <MiniStat
              label="Output tokens"
              value={formatNumber(data.tokens.outputTokens)}
            />
            <MiniStat
              label="Average"
              value={
                data.tokens.averageTokens == null
                  ? "—"
                  : formatNumber(data.tokens.averageTokens)
              }
            />
          </div>
          <SectionLabel>Top consumers</SectionLabel>
          <div className="mb-3 max-h-36 space-y-1 overflow-y-auto">
            {data.tokens.topConsumers.map((row) => (
              <div
                key={row.userId}
                className="rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
              >
                <span className="text-[var(--admin-text)]">
                  {row.fullName || row.email}
                </span>{" "}
                · {row.requests} req · {formatNumber(row.tokens)} tok ·{" "}
                {money(row.estimatedCostUsd)}
              </div>
            ))}
          </div>
          <SectionLabel>Workspace distribution</SectionLabel>
          <NamedMoneyList
            rows={data.tokens.byWorkspace.map((r) => ({
              label: r.workspaceName,
              value: r.tokens,
              money: r.estimatedCostUsd,
            }))}
          />
          <SectionLabel>Project distribution</SectionLabel>
          <NamedMoneyList
            rows={data.tokens.byProject.map((r) => ({
              label: r.projectName,
              value: r.tokens,
              money: r.estimatedCostUsd,
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Request analytics" subtitle="Hourly · daily · weekly · monthly">
          <SectionLabel>Hourly (24h buckets)</SectionLabel>
          <BarTrend
            points={data.requests.hourly}
            color="#93c5fd"
            label="Hourly AI requests"
          />
          <SectionLabel>Daily</SectionLabel>
          <BarTrend
            points={data.requests.daily}
            color="#60a5fa"
            label="Daily AI requests"
          />
          <SectionLabel>Weekly</SectionLabel>
          <BarTrend
            points={data.requests.weekly}
            color="#3b82f6"
            label="Weekly AI requests"
          />
          <SectionLabel>Monthly</SectionLabel>
          <BarTrend
            points={data.requests.monthly}
            color="#2563eb"
            label="Monthly AI requests"
          />
          <p className="mt-3 text-[11px] text-[var(--admin-muted)]">
            Success vs failure: {data.requests.successVsFailureNote}
          </p>
        </Panel>

        <Panel title="Prompt analytics" subtitle={data.prompts.note}>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <MiniStat
              label="Longest prompt"
              value={
                data.prompts.longestPromptChars == null
                  ? "—"
                  : `${formatNumber(data.prompts.longestPromptChars)} chars`
              }
            />
            <MiniStat
              label="Largest response"
              value={
                data.prompts.largestResponseChars == null
                  ? "—"
                  : `${formatNumber(data.prompts.largestResponseChars)} chars`
              }
            />
          </div>
          <SectionLabel>Prompt growth</SectionLabel>
          <BarTrend
            points={data.prompts.promptGrowth}
            color="#93c5fd"
            label="Prompt growth"
          />
          <SectionLabel>Categories</SectionLabel>
          <NamedList rows={data.prompts.categories} />
          <SectionLabel>Top conversation titles</SectionLabel>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {data.prompts.topConversationTitles.length === 0 ? (
              <Empty>No conversations.</Empty>
            ) : (
              data.prompts.topConversationTitles.map((row) => (
                <div
                  key={`${row.title}-${row.model}-${row.messageCount}`}
                  className="rounded-lg border border-[var(--admin-border)] px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
                >
                  <span className="text-[var(--admin-text)]">{row.title}</span> ·{" "}
                  {row.messageCount} msgs · {row.model}
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Workspace AI" subtitle="Requests · tokens · estimated cost">
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {data.workspaceAi.length === 0 ? (
              <AdminEmptyState title="No project-scoped AI usage in range." />
            ) : (
              data.workspaceAi.map((row) => (
                <div
                  key={row.workspaceId}
                  className="rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-[11px] text-[var(--admin-muted)]"
                >
                  <span className="text-[var(--admin-text)]">
                    {row.workspaceName}
                  </span>{" "}
                  · {row.requests} req · {formatNumber(row.tokens)} tok · errors
                  — · latency — · {money(row.estimatedCostUsd)}
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Project AI" subtitle="Ranked by usage">
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {data.projectAi.length === 0 ? (
              <AdminEmptyState title="No project-scoped AI usage in range." />
            ) : (
              data.projectAi.map((row) => (
                <div
                  key={row.projectId}
                  className="rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-[11px] text-[var(--admin-muted)]"
                >
                  <span className="text-[var(--admin-text)]">{row.projectName}</span>{" "}
                  · {row.workspaceName} · {row.requests} req ·{" "}
                  {formatNumber(row.tokens)} tok · latency — · errors — ·{" "}
                  {money(row.estimatedCostUsd)}
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="AI health" subtitle="Provider · queue · availability">
          <div className="mb-3 flex items-center gap-2">
            <HealthDot tone={data.health.openaiTone} />
            <div>
              <p className="text-sm text-[var(--admin-text)]">OpenAI</p>
              <p className="text-[11px] text-[var(--admin-muted)]">
                {data.health.openaiDetail}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-[var(--admin-muted)]">
            Queue: {data.health.queueNote}
          </p>
          <p className="mt-2 text-[11px] text-[var(--admin-muted)]">
            Avg latency: — · Error rate: —
          </p>
          <p className="mt-2 text-[11px] text-[var(--admin-muted)]">
            Availability:{" "}
            {data.health.availabilityPercent == null
              ? "—"
              : `${data.health.availabilityPercent}%`}
          </p>
          <p className="mt-1 text-[10px] text-[var(--admin-accent-text)]">
            {data.health.availabilityNote}
          </p>
        </Panel>

        <Panel title="AI incidents" subtitle={data.incidents.note}>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {data.incidents.items.length === 0 ? (
              <Empty>No negative feedback signals in range.</Empty>
            ) : (
              data.incidents.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-rose-500/15 px-2 py-1.5 text-[11px] text-[var(--admin-muted)]"
                >
                  <p className="text-[var(--admin-text)]">{item.title}</p>
                  {item.detail} · {formatRelative(item.occurredAt)}
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Cost analytics" subtitle={data.cost.pricingNote}>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <MiniStat
              label="Daily"
              value={money(data.cost.estimatedDailyUsd)}
            />
            <MiniStat
              label="Weekly"
              value={money(data.cost.estimatedWeeklyUsd)}
            />
            <MiniStat
              label="Monthly"
              value={money(data.cost.estimatedMonthlyUsd)}
            />
          </div>
          <SectionLabel>Per workspace</SectionLabel>
          <NamedMoneyList
            rows={data.cost.byWorkspace.map((r) => ({
              label: r.workspaceName,
              value: null,
              money: r.estimatedCostUsd,
            }))}
          />
          <SectionLabel>Per project</SectionLabel>
          <NamedMoneyList
            rows={data.cost.byProject.map((r) => ({
              label: r.projectName,
              value: null,
              money: r.estimatedCostUsd,
            }))}
          />
        </Panel>
      </div>

      <p className="text-[11px] text-[var(--admin-muted)]">
        Honest gaps: {data.unavailable.join(" · ")}.
      </p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-glass admin-panel rounded-2xl p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 mt-3 text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
      {children}
    </p>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-2">
      <p className="text-[10px] uppercase text-[var(--admin-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--admin-text)]">{value}</p>
    </div>
  );
}

function NamedList({ rows }: { rows: { label: string; value: number }[] }) {
  if (rows.length === 0) return <Empty>No data.</Empty>;
  return (
    <div className="max-h-28 space-y-1 overflow-y-auto">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] px-2 py-1 text-[11px]"
        >
          <span className="text-[var(--admin-text)]">{row.label}</span>
          <span className="text-[var(--admin-accent-text)]">
            {row.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function NamedMoneyList({
  rows,
}: {
  rows: { label: string; value: number | null; money: number }[];
}) {
  if (rows.length === 0) return <Empty>No data.</Empty>;
  return (
    <div className="mb-2 max-h-28 space-y-1 overflow-y-auto">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] px-2 py-1 text-[11px]"
        >
          <span className="truncate text-[var(--admin-text)]">{row.label}</span>
          <span className="shrink-0 text-[var(--admin-accent-text)]">
            {row.value == null ? "" : `${formatNumber(row.value)} · `}
            {money(row.money)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-xs text-[var(--admin-muted)]">{children}</p>;
}
