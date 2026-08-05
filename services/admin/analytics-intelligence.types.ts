import type { ApiKeyEnvironment } from "@/types/database";

export type AnalyticsRange = "24h" | "7d" | "30d" | "90d";

export interface AnalyticsFilters {
  range?: AnalyticsRange;
  from?: string;
  to?: string;
  workspaceId?: string;
  projectId?: string;
  country?: string;
  environment?: ApiKeyEnvironment | "";
}

export interface NamedCount {
  label: string;
  value: number;
}

export interface SeriesPoint {
  label: string;
  activeUsers: number;
  newUsers: number;
  workspaces: number;
  projects: number;
  apiEvents: number;
  aiRequests: number;
  errors: number;
  heartbeats: number;
}

export interface CountryPoint {
  country: string;
  sessions: number;
  users: number;
  errors: number;
  heartbeats: number;
  x: number;
  y: number;
}

export interface AnalyticsIntelligenceData {
  generatedAt: string;
  filters: AnalyticsFilters;
  executive: {
    dau: number;
    wau: number;
    mau: number;
    newUsers: number;
    /** Proxy: % of prior-window actives who returned in current window. */
    retentionProxyPercent: number | null;
    /** Proxy: % of prior-window actives with no activity in current window. */
    churnProxyPercent: number | null;
    workspaceGrowth: number;
    projectGrowth: number;
    apiGrowth: number;
    aiRequests: number;
    aiTokens: number;
    sdkAdoptionPercent: number | null;
  };
  series: SeriesPoint[];
  users: {
    countries: NamedCount[];
    browsers: NamedCount[];
    operatingSystems: NamedCount[];
    languages: NamedCount[];
    devices: NamedCount[];
    newSessions: number;
    returningSessions: number;
    /** Always null — dwell time is not stored. */
    averageSessionDurationMs: number | null;
    sessionDurationNote: string;
  };
  workspaces: {
    growth: number;
    totalProjects: number;
    totalMembers: number;
    byPlan: NamedCount[];
    apiEvents: number;
    averageHealthScore: number | null;
    rows: {
      id: string;
      name: string;
      plan: string;
      projects: number;
      members: number;
      apiEvents: number;
      healthScore: number | null;
    }[];
  };
  api: {
    requests: number;
    successEvents: number;
    failureEvents: number;
    successRate: number | null;
    errorRate: number | null;
    averageLatencyMs: number | null;
    p50Ms: number | null;
    p95Ms: number | null;
    p99Ms: number | null;
    topEndpoints: {
      url: string;
      samples: number;
      avgMs: number | null;
      p95Ms: number | null;
    }[];
    byEnvironment: NamedCount[];
    trafficTrend: { label: string; value: number }[];
  };
  ai: {
    requests: number;
    tokens: number;
    byModel: { model: string; requests: number; tokens: number }[];
    /** Always null until latency is persisted. */
    averageLatencyMs: null;
    successRate: number | null;
    dailyTrend: { label: string; requests: number; tokens: number }[];
  };
  sdk: {
    versions: {
      release: string;
      environment: string;
      heartbeats: number;
      errors: number;
      lastSeen: string;
    }[];
    installations: number;
    heartbeats: number;
    errors: number;
    byEnvironment: NamedCount[];
    performanceSamples: number;
  };
  errors: {
    top: {
      id: string;
      message: string;
      occurrences: number;
      lastSeen: string;
      projectId: string;
      projectName: string;
      workspaceId: string;
      workspaceName: string;
    }[];
    trend: { label: string; value: number }[];
    frequency: number;
    averageResolutionSeconds: number | null;
    affectedProjects: number;
    affectedWorkspaces: number;
  };
  performance: {
    averageMs: number | null;
    p50Ms: number | null;
    p95Ms: number | null;
    p99Ms: number | null;
    slowEndpoints: {
      url: string;
      samples: number;
      p95Ms: number | null;
    }[];
  };
  geography: {
    countries: CountryPoint[];
    regions: NamedCount[];
    cityNote: string;
  };
  filterOptions: {
    workspaces: { id: string; name: string }[];
    projects: { id: string; name: string; workspaceId: string }[];
  };
  unavailable: string[];
}
