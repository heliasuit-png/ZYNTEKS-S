export type AiOpsRange = "24h" | "7d" | "30d" | "90d";

export interface AiOpsFilters {
  range?: AiOpsRange;
  from?: string;
  to?: string;
  workspaceId?: string;
  projectId?: string;
  model?: string;
  /** Not stored on AI tables — accepted for UI parity, ignored in queries. */
  environment?: string;
}

export interface NamedCount {
  label: string;
  value: number;
}

export interface AiOpsOverview {
  totalRequests: number;
  requestsToday: number;
  /** Always null — failed AI calls are not persisted. */
  successfulRequests: number | null;
  /** Always null — failed AI calls are not persisted. */
  failedRequests: number | null;
  /** Always null — latency is not stored on ai_usage. */
  averageResponseTimeMs: number | null;
  averageTokens: number | null;
  estimatedCostUsd: number | null;
  mostUsedModel: string | null;
}

export interface ModelAnalyticsRow {
  model: string;
  requests: number;
  usagePercent: number;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  /** Always null. */
  averageLatencyMs: null;
  /** Always null. */
  successRate: null;
  dailyTrend: { label: string; requests: number; tokens: number }[];
}

export interface AiOpsData {
  generatedAt: string;
  filters: AiOpsFilters;
  overview: AiOpsOverview;
  models: ModelAnalyticsRow[];
  tokens: {
    inputTokens: number;
    outputTokens: number;
    averageTokens: number | null;
    topConsumers: {
      userId: string;
      email: string;
      fullName: string | null;
      requests: number;
      tokens: number;
      estimatedCostUsd: number;
    }[];
    byWorkspace: {
      workspaceId: string;
      workspaceName: string;
      requests: number;
      tokens: number;
      estimatedCostUsd: number;
    }[];
    byProject: {
      projectId: string;
      projectName: string;
      workspaceId: string;
      workspaceName: string;
      requests: number;
      tokens: number;
      estimatedCostUsd: number;
    }[];
  };
  requests: {
    hourly: { label: string; value: number }[];
    daily: { label: string; value: number }[];
    weekly: { label: string; value: number }[];
    monthly: { label: string; value: number }[];
    /** Success/failure split unavailable — only successful completions recorded. */
    successVsFailureNote: string;
  };
  prompts: {
    topConversationTitles: { title: string; messageCount: number; model: string }[];
    categories: NamedCount[];
    longestPromptChars: number | null;
    largestResponseChars: number | null;
    promptGrowth: { label: string; value: number }[];
    contentExposed: false;
    note: string;
  };
  workspaceAi: {
    workspaceId: string;
    workspaceName: string;
    requests: number;
    tokens: number;
    /** Always null — AI errors not persisted. */
    errors: null;
    /** Always null. */
    averageLatencyMs: null;
    estimatedCostUsd: number;
  }[];
  projectAi: {
    projectId: string;
    projectName: string;
    workspaceId: string;
    workspaceName: string;
    requests: number;
    tokens: number;
    estimatedCostUsd: number;
    /** Always null. */
    latencyMs: null;
    /** Always null. */
    errors: null;
  }[];
  health: {
    openaiConfigured: boolean;
    openaiModel: string;
    openaiTone: "green" | "yellow" | "red";
    openaiDetail: string;
    queueNote: string;
    averageLatencyMs: null;
    errorRate: null;
    availabilityPercent: number | null;
    availabilityNote: string;
  };
  incidents: {
    items: {
      id: string;
      kind: string;
      title: string;
      detail: string;
      occurredAt: string;
    }[];
    note: string;
  };
  cost: {
    estimatedDailyUsd: number;
    estimatedWeeklyUsd: number;
    estimatedMonthlyUsd: number;
    byWorkspace: {
      workspaceId: string;
      workspaceName: string;
      estimatedCostUsd: number;
    }[];
    byProject: {
      projectId: string;
      projectName: string;
      estimatedCostUsd: number;
    }[];
    pricingNote: string;
  };
  filterOptions: {
    workspaces: { id: string; name: string }[];
    projects: { id: string; name: string; workspaceId: string }[];
    models: string[];
  };
  unavailable: string[];
}
