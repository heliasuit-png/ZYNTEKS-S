import "server-only";

import { env } from "@/lib/env";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { round } from "@/services/health/math";
import { assertAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import type {
  AiOpsData,
  AiOpsFilters,
  AiOpsRange,
  ModelAnalyticsRow,
} from "@/services/admin/ai-operations.types";
import { createSupabaseAdminClient } from "@/supabase/admin";

/** Public list prices ($ / 1M tokens) used only for transparent estimates. */
const MODEL_PRICING: Record<
  string,
  { inputPerMillion: number; outputPerMillion: number }
> = {
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10 },
  "gpt-4.1-mini": { inputPerMillion: 0.4, outputPerMillion: 1.6 },
  "gpt-4.1": { inputPerMillion: 2, outputPerMillion: 8 },
  "o4-mini": { inputPerMillion: 1.1, outputPerMillion: 4.4 },
};

const DEFAULT_PRICING = { inputPerMillion: 0.15, outputPerMillion: 0.6 };

function pricingFor(model: string) {
  const key = Object.keys(MODEL_PRICING).find((name) =>
    model.toLowerCase().includes(name.toLowerCase()),
  );
  return key ? MODEL_PRICING[key]! : DEFAULT_PRICING;
}

function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const rates = pricingFor(model);
  const cost =
    (promptTokens / 1_000_000) * rates.inputPerMillion +
    (completionTokens / 1_000_000) * rates.outputPerMillion;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

function rangeToMs(range: AiOpsRange): number {
  switch (range) {
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
    case "90d":
      return 90 * 24 * 60 * 60 * 1000;
  }
}

function resolveWindow(filters: AiOpsFilters): {
  since: string;
  until: string;
  range: AiOpsRange;
} {
  const until = filters.to?.trim()
    ? new Date(filters.to).toISOString()
    : new Date().toISOString();
  if (filters.from?.trim()) {
    return {
      since: new Date(filters.from).toISOString(),
      until,
      range: filters.range ?? "30d",
    };
  }
  const range = filters.range ?? "30d";
  return {
    since: new Date(Date.now() - rangeToMs(range)).toISOString(),
    until,
    range,
  };
}

function startOfUtcDayIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

function dayLabels(since: string, until: string): string[] {
  const labels: string[] = [];
  const cursor = new Date(since);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(until);
  while (cursor <= end) {
    labels.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return labels.length ? labels : [new Date(since).toISOString().slice(0, 10)];
}

function hourLabels(hours = 24): string[] {
  const labels: string[] = [];
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);
  for (let i = hours - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    labels.push(d.toISOString().slice(0, 13));
  }
  return labels;
}

function categorizePrompt(title: string, hasProject: boolean): string {
  const t = title.toLowerCase();
  if (hasProject) return "Project-assisted";
  if (t.includes("error") || t.includes("bug") || t.includes("fix")) {
    return "Troubleshooting";
  }
  if (t.includes("deploy") || t.includes("infra") || t.includes("devops")) {
    return "Operations";
  }
  if (t.includes("new conversation") || t === "new conversation") {
    return "General";
  }
  return "General chat";
}

export async function getAiOperations(
  role: AdminPlatformRole,
  filters: AiOpsFilters = {},
): Promise<AiOpsData> {
  assertAdminPermission(role, "admin:ai:read");
  const admin = createSupabaseAdminClient();
  const { since, until, range } = resolveWindow(filters);
  const today = startOfUtcDayIso();
  const labels = dayLabels(since, until);
  const hours = hourLabels(24);

  const [workspacesRes, projectsRes, usageRes, conversationsRes] =
    await Promise.all([
      admin.from("workspaces").select("id, name").order("name").limit(500),
      admin.from("projects").select("id, name, workspace_id").limit(2000),
      (() => {
        let q = admin
          .from("ai_usage")
          .select(
            "id, user_id, conversation_id, message_id, model, prompt_tokens, completion_tokens, total_tokens, created_at",
          )
          .gte("created_at", since)
          .lte("created_at", until)
          .order("created_at", { ascending: false })
          .limit(8000);
        if (filters.model) q = q.eq("model", filters.model);
        return q;
      })(),
      admin
        .from("ai_conversations")
        .select("id, user_id, project_id, title, model, message_count, created_at, last_message_at")
        .order("last_message_at", { ascending: false })
        .limit(2000),
    ]);

  for (const result of [
    workspacesRes,
    projectsRes,
    usageRes,
    conversationsRes,
  ]) {
    if (result.error) throw mapPostgrestError(result.error);
  }

  const workspaceMap = new Map(
    (workspacesRes.data ?? []).map((row) => [row.id, row.name]),
  );
  const projectMap = new Map(
    (projectsRes.data ?? []).map((row) => [
      row.id,
      {
        name: row.name,
        workspaceId: row.workspace_id,
        workspaceName: workspaceMap.get(row.workspace_id) ?? "Workspace",
      },
    ]),
  );

  const conversationMap = new Map(
    (conversationsRes.data ?? []).map((row) => [row.id, row]),
  );

  let usage = usageRes.data ?? [];

  // Scope by project/workspace via conversation → project
  if (filters.projectId || filters.workspaceId) {
    const allowedConversations = new Set(
      (conversationsRes.data ?? [])
        .filter((c) => {
          if (filters.projectId && c.project_id !== filters.projectId) {
            return false;
          }
          if (filters.workspaceId) {
            if (!c.project_id) return false;
            const project = projectMap.get(c.project_id);
            if (!project || project.workspaceId !== filters.workspaceId) {
              return false;
            }
          }
          return true;
        })
        .map((c) => c.id),
    );
    usage = usage.filter(
      (row) =>
        row.conversation_id != null &&
        allowedConversations.has(row.conversation_id),
    );
  }

  const totalRequests = usage.length;
  const requestsToday = usage.filter((row) => row.created_at >= today).length;
  const totalPrompt = usage.reduce((sum, row) => sum + (row.prompt_tokens ?? 0), 0);
  const totalCompletion = usage.reduce(
    (sum, row) => sum + (row.completion_tokens ?? 0),
    0,
  );
  const totalTokens = usage.reduce((sum, row) => sum + (row.total_tokens ?? 0), 0);
  const averageTokens =
    totalRequests === 0 ? null : round(totalTokens / totalRequests);

  let estimatedCostUsd = 0;
  for (const row of usage) {
    estimatedCostUsd += estimateCostUsd(
      row.model,
      row.prompt_tokens ?? 0,
      row.completion_tokens ?? 0,
    );
  }
  estimatedCostUsd = Math.round(estimatedCostUsd * 1_000_000) / 1_000_000;

  const modelCounts = new Map<
    string,
    {
      requests: number;
      tokens: number;
      promptTokens: number;
      completionTokens: number;
      daily: Map<string, { requests: number; tokens: number }>;
    }
  >();
  for (const row of usage) {
    const entry = modelCounts.get(row.model) ?? {
      requests: 0,
      tokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      daily: new Map(labels.map((label) => [label, { requests: 0, tokens: 0 }])),
    };
    entry.requests += 1;
    entry.tokens += row.total_tokens ?? 0;
    entry.promptTokens += row.prompt_tokens ?? 0;
    entry.completionTokens += row.completion_tokens ?? 0;
    const day = row.created_at.slice(0, 10);
    const bucket = entry.daily.get(day);
    if (bucket) {
      bucket.requests += 1;
      bucket.tokens += row.total_tokens ?? 0;
    }
    modelCounts.set(row.model, entry);
  }

  const models: ModelAnalyticsRow[] = [...modelCounts.entries()]
    .map(([model, stats]) => ({
      model,
      requests: stats.requests,
      usagePercent:
        totalRequests === 0
          ? 0
          : Math.round((stats.requests / totalRequests) * 1000) / 10,
      tokens: stats.tokens,
      promptTokens: stats.promptTokens,
      completionTokens: stats.completionTokens,
      averageLatencyMs: null,
      successRate: null,
      dailyTrend: labels.map((label) => ({
        label,
        requests: stats.daily.get(label)?.requests ?? 0,
        tokens: stats.daily.get(label)?.tokens ?? 0,
      })),
    }))
    .sort((a, b) => b.requests - a.requests);

  const mostUsedModel = models[0]?.model ?? null;

  // Consumers
  const byUser = new Map<
    string,
    { requests: number; tokens: number; prompt: number; completion: number; model: string }
  >();
  for (const row of usage) {
    const entry = byUser.get(row.user_id) ?? {
      requests: 0,
      tokens: 0,
      prompt: 0,
      completion: 0,
      model: row.model,
    };
    entry.requests += 1;
    entry.tokens += row.total_tokens ?? 0;
    entry.prompt += row.prompt_tokens ?? 0;
    entry.completion += row.completion_tokens ?? 0;
    byUser.set(row.user_id, entry);
  }
  const userIds = [...byUser.keys()];
  const profilesRes =
    userIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds.slice(0, 500))
      : { data: [], error: null };
  if (profilesRes.error) throw mapPostgrestError(profilesRes.error);
  const profileMap = new Map(
    (profilesRes.data ?? []).map((row) => [
      row.id,
      { email: row.email, fullName: row.full_name },
    ]),
  );

  const topConsumers = [...byUser.entries()]
    .map(([userId, stats]) => {
      const profile = profileMap.get(userId);
      return {
        userId,
        email: profile?.email ?? "—",
        fullName: profile?.fullName ?? null,
        requests: stats.requests,
        tokens: stats.tokens,
        estimatedCostUsd: estimateCostUsd(
          stats.model,
          stats.prompt,
          stats.completion,
        ),
      };
    })
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 20);

  // Workspace / project attribution via conversation
  const byWorkspace = new Map<
    string,
    { requests: number; tokens: number; prompt: number; completion: number; model: string }
  >();
  const byProject = new Map<
    string,
    { requests: number; tokens: number; prompt: number; completion: number; model: string }
  >();
  let unscoped = 0;
  for (const row of usage) {
    const conversation = row.conversation_id
      ? conversationMap.get(row.conversation_id)
      : null;
    const projectId = conversation?.project_id ?? null;
    if (!projectId) {
      unscoped += 1;
      continue;
    }
    const project = projectMap.get(projectId);
    if (!project) continue;

    const pEntry = byProject.get(projectId) ?? {
      requests: 0,
      tokens: 0,
      prompt: 0,
      completion: 0,
      model: row.model,
    };
    pEntry.requests += 1;
    pEntry.tokens += row.total_tokens ?? 0;
    pEntry.prompt += row.prompt_tokens ?? 0;
    pEntry.completion += row.completion_tokens ?? 0;
    byProject.set(projectId, pEntry);

    const wEntry = byWorkspace.get(project.workspaceId) ?? {
      requests: 0,
      tokens: 0,
      prompt: 0,
      completion: 0,
      model: row.model,
    };
    wEntry.requests += 1;
    wEntry.tokens += row.total_tokens ?? 0;
    wEntry.prompt += row.prompt_tokens ?? 0;
    wEntry.completion += row.completion_tokens ?? 0;
    byWorkspace.set(project.workspaceId, wEntry);
  }
  void unscoped;

  const tokensByWorkspace = [...byWorkspace.entries()]
    .map(([workspaceId, stats]) => ({
      workspaceId,
      workspaceName: workspaceMap.get(workspaceId) ?? "Workspace",
      requests: stats.requests,
      tokens: stats.tokens,
      estimatedCostUsd: estimateCostUsd(
        stats.model,
        stats.prompt,
        stats.completion,
      ),
    }))
    .sort((a, b) => b.tokens - a.tokens);

  const tokensByProject = [...byProject.entries()]
    .map(([projectId, stats]) => {
      const project = projectMap.get(projectId);
      return {
        projectId,
        projectName: project?.name ?? "Project",
        workspaceId: project?.workspaceId ?? "",
        workspaceName: project?.workspaceName ?? "Workspace",
        requests: stats.requests,
        tokens: stats.tokens,
        estimatedCostUsd: estimateCostUsd(
          stats.model,
          stats.prompt,
          stats.completion,
        ),
      };
    })
    .sort((a, b) => b.tokens - a.tokens);

  // Request trends
  const hourlyMap = new Map(hours.map((label) => [label, 0]));
  const dailyMap = new Map(labels.map((label) => [label, 0]));
  for (const row of usage) {
    const hour = row.created_at.slice(0, 13);
    if (hourlyMap.has(hour)) {
      hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + 1);
    }
    const day = row.created_at.slice(0, 10);
    if (dailyMap.has(day)) {
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    }
  }

  // Weekly buckets (ISO week start Monday)
  const weeklyMap = new Map<string, number>();
  for (const row of usage) {
    const d = new Date(row.created_at);
    const day = d.getUTCDay();
    const diff = (day + 6) % 7;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - diff);
    monday.setUTCHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);
    weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + 1);
  }
  const weekly = [...weeklyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, value]) => ({ label, value }));

  const monthlyMap = new Map<string, number>();
  for (const row of usage) {
    const key = row.created_at.slice(0, 7);
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
  }
  const monthly = [...monthlyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, value]) => ({ label, value }));

  // Prompt analytics — lengths only, no content exposure
  const messageIds = usage
    .map((row) => row.message_id)
    .filter((id): id is string => Boolean(id))
    .slice(0, 500);
  let longestPromptChars: number | null = null;
  let largestResponseChars: number | null = null;

  if (messageIds.length > 0) {
    const { data: messages, error: msgError } = await admin
      .from("ai_messages")
      .select("id, role, content, created_at")
      .in("id", messageIds)
      .limit(500);
    if (msgError) throw mapPostgrestError(msgError);
    for (const msg of messages ?? []) {
      const len = msg.content?.length ?? 0;
      if (msg.role === "user") {
        longestPromptChars =
          longestPromptChars == null ? len : Math.max(longestPromptChars, len);
      } else if (msg.role === "assistant") {
        largestResponseChars =
          largestResponseChars == null
            ? len
            : Math.max(largestResponseChars, len);
      }
    }
  }

  const { data: userMsgDays, error: userMsgError } = await admin
    .from("ai_messages")
    .select("created_at")
    .eq("role", "user")
    .gte("created_at", since)
    .lte("created_at", until)
    .limit(5000);
  if (userMsgError) throw mapPostgrestError(userMsgError);
  const promptGrowthFull = new Map(labels.map((label) => [label, 0]));
  for (const msg of userMsgDays ?? []) {
    const day = msg.created_at.slice(0, 10);
    if (promptGrowthFull.has(day)) {
      promptGrowthFull.set(day, (promptGrowthFull.get(day) ?? 0) + 1);
    }
  }

  // Categories + top titles from conversations (no prompt body)
  let scopedConversations = conversationsRes.data ?? [];
  if (filters.projectId) {
    scopedConversations = scopedConversations.filter(
      (c) => c.project_id === filters.projectId,
    );
  }
  if (filters.workspaceId) {
    scopedConversations = scopedConversations.filter((c) => {
      if (!c.project_id) return false;
      return projectMap.get(c.project_id)?.workspaceId === filters.workspaceId;
    });
  }
  if (filters.model) {
    scopedConversations = scopedConversations.filter(
      (c) => c.model === filters.model,
    );
  }

  const categoryMap = new Map<string, number>();
  for (const c of scopedConversations) {
    const cat = categorizePrompt(c.title, Boolean(c.project_id));
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
  }

  const topConversationTitles = [...scopedConversations]
    .sort((a, b) => (b.message_count ?? 0) - (a.message_count ?? 0))
    .slice(0, 15)
    .map((c) => ({
      title: c.title || "Untitled",
      messageCount: c.message_count,
      model: c.model,
    }));

  // Cost windows
  const dayMs = 24 * 60 * 60 * 1000;
  const weekAgo = new Date(Date.now() - 7 * dayMs).toISOString();
  const monthAgo = new Date(Date.now() - 30 * dayMs).toISOString();
  let dailyCost = 0;
  let weeklyCost = 0;
  let monthlyCost = 0;
  for (const row of usage) {
    const cost = estimateCostUsd(
      row.model,
      row.prompt_tokens ?? 0,
      row.completion_tokens ?? 0,
    );
    if (row.created_at >= today) dailyCost += cost;
    if (row.created_at >= weekAgo) weeklyCost += cost;
    if (row.created_at >= monthAgo) monthlyCost += cost;
  }

  // Health
  const openaiConfigured = Boolean(env.OPENAI_API_KEY);
  const openaiTone = openaiConfigured
    ? totalRequests > 0
      ? "green"
      : "yellow"
    : "red";
  const windowDays = Math.max(
    1,
    (new Date(until).getTime() - new Date(since).getTime()) / dayMs,
  );
  const availabilityPercent =
    !openaiConfigured
      ? 0
      : totalRequests > 0
        ? 100
        : null;

  // Incidents: negative feedback as soft signal; no timeout/rate-limit tables
  const { data: feedback, error: feedbackError } = await admin
    .from("ai_feedback")
    .select("id, rating, comment, created_at, message_id")
    .eq("rating", "down")
    .gte("created_at", since)
    .lte("created_at", until)
    .order("created_at", { ascending: false })
    .limit(40);
  if (feedbackError) throw mapPostgrestError(feedbackError);

  const incidentItems = (feedback ?? []).map((row) => ({
    id: row.id,
    kind: "negative_feedback",
    title: "Negative AI feedback",
    detail: row.comment?.trim()
      ? "User left a downvote with a comment (content not shown)."
      : "User left a downvote on an assistant message.",
    occurredAt: row.created_at,
  }));

  const allModels = [
    ...new Set([
      ...models.map((m) => m.model),
      ...(conversationsRes.data ?? []).map((c) => c.model),
    ]),
  ].sort();

  return {
    generatedAt: new Date().toISOString(),
    filters: { ...filters, range },
    overview: {
      totalRequests,
      requestsToday,
      successfulRequests: null,
      failedRequests: null,
      averageResponseTimeMs: null,
      averageTokens,
      estimatedCostUsd,
      mostUsedModel,
    },
    models,
    tokens: {
      inputTokens: totalPrompt,
      outputTokens: totalCompletion,
      averageTokens,
      topConsumers,
      byWorkspace: tokensByWorkspace.slice(0, 25),
      byProject: tokensByProject.slice(0, 25),
    },
    requests: {
      hourly: hours.map((label) => ({
        label,
        value: hourlyMap.get(label) ?? 0,
      })),
      daily: labels.map((label) => ({
        label,
        value: dailyMap.get(label) ?? 0,
      })),
      weekly,
      monthly,
      successVsFailureNote:
        "Only successful completions are written to ai_usage. Failed/timeout/rate-limit outcomes are not persisted.",
    },
    prompts: {
      topConversationTitles,
      categories: [...categoryMap.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
      longestPromptChars,
      largestResponseChars,
      promptGrowth: labels.map((label) => ({
        label,
        value: promptGrowthFull.get(label) ?? 0,
      })),
      contentExposed: false,
      note: "Prompt and response bodies are not listed. Stats use message lengths and conversation titles only.",
    },
    workspaceAi: tokensByWorkspace.slice(0, 25).map((row) => ({
      workspaceId: row.workspaceId,
      workspaceName: row.workspaceName,
      requests: row.requests,
      tokens: row.tokens,
      errors: null,
      averageLatencyMs: null,
      estimatedCostUsd: row.estimatedCostUsd,
    })),
    projectAi: tokensByProject.slice(0, 25).map((row) => ({
      projectId: row.projectId,
      projectName: row.projectName,
      workspaceId: row.workspaceId,
      workspaceName: row.workspaceName,
      requests: row.requests,
      tokens: row.tokens,
      estimatedCostUsd: row.estimatedCostUsd,
      latencyMs: null,
      errors: null,
    })),
    health: {
      openaiConfigured,
      openaiModel: env.OPENAI_MODEL,
      openaiTone,
      openaiDetail: openaiConfigured
        ? `Configured · model ${env.OPENAI_MODEL}`
        : "OPENAI_API_KEY not configured",
      queueNote:
        "No dedicated AI request queue is persisted. Completions are recorded after success only.",
      averageLatencyMs: null,
      errorRate: null,
      availabilityPercent,
      availabilityNote:
        availabilityPercent == null
          ? "No AI usage in range while API is configured — availability cannot be proven from completions alone."
          : availabilityPercent === 0
            ? "OpenAI is not configured."
            : `Based on ${totalRequests} recorded completions across ~${round(windowDays)} day(s). Failures are not stored.`,
    },
    incidents: {
      items: incidentItems,
      note: "Timeouts, rate limits, and model provider errors are not stored as AI incidents. Showing negative feedback signals only.",
    },
    cost: {
      estimatedDailyUsd: Math.round(dailyCost * 1_000_000) / 1_000_000,
      estimatedWeeklyUsd: Math.round(weeklyCost * 1_000_000) / 1_000_000,
      estimatedMonthlyUsd: Math.round(monthlyCost * 1_000_000) / 1_000_000,
      byWorkspace: tokensByWorkspace.slice(0, 25).map((row) => ({
        workspaceId: row.workspaceId,
        workspaceName: row.workspaceName,
        estimatedCostUsd: row.estimatedCostUsd,
      })),
      byProject: tokensByProject.slice(0, 25).map((row) => ({
        projectId: row.projectId,
        projectName: row.projectName,
        estimatedCostUsd: row.estimatedCostUsd,
      })),
      pricingNote:
        "Costs are estimates from public OpenAI list prices × recorded prompt/completion tokens. Not invoices.",
    },
    filterOptions: {
      workspaces: (workspacesRes.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
      })),
      projects: (projectsRes.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        workspaceId: row.workspace_id,
      })),
      models: allModels,
    },
    unavailable: [
      "failed_requests",
      "ai_latency",
      "success_rate",
      "ai_queue",
      "timeouts_rate_limits",
      "environment_on_ai_usage",
      "prompt_body_listing",
    ],
  };
}

function csvEscape(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export async function exportAiOpsJson(
  role: AdminPlatformRole,
  filters: AiOpsFilters,
): Promise<string> {
  const data = await getAiOperations(role, filters);
  return JSON.stringify(data, null, 2);
}

export async function exportAiOpsCsv(
  role: AdminPlatformRole,
  filters: AiOpsFilters,
): Promise<string> {
  const data = await getAiOperations(role, filters);
  const lines = ["section,metric,label,value"];
  const push = (
    section: string,
    metric: string,
    label: string,
    value: string | number | null,
  ) => {
    lines.push([section, metric, label, value].map(csvEscape).join(","));
  };

  push("overview", "total_requests", "Total", data.overview.totalRequests);
  push("overview", "requests_today", "Today", data.overview.requestsToday);
  push("overview", "average_tokens", "Avg tokens", data.overview.averageTokens);
  push(
    "overview",
    "estimated_cost_usd",
    "Estimated cost",
    data.overview.estimatedCostUsd,
  );
  push(
    "overview",
    "most_used_model",
    "Model",
    data.overview.mostUsedModel,
  );

  for (const model of data.models) {
    push("models", "requests", model.model, model.requests);
    push("models", "tokens", model.model, model.tokens);
    push("models", "usage_percent", model.model, model.usagePercent);
  }
  for (const row of data.tokens.topConsumers) {
    push("consumers", "tokens", row.email, row.tokens);
  }
  for (const row of data.workspaceAi) {
    push("workspaces", "tokens", row.workspaceName, row.tokens);
    push("workspaces", "estimated_cost_usd", row.workspaceName, row.estimatedCostUsd);
  }
  for (const row of data.projectAi) {
    push("projects", "tokens", row.projectName, row.tokens);
  }
  for (const point of data.requests.daily) {
    push("requests", "daily", point.label, point.value);
  }

  return `${lines.join("\n")}\n`;
}
