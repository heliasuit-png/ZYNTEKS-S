/**
 * Types for the Autonomous Monitoring Intelligence Engine.
 *
 * Everything here is derived deterministically from recorded telemetry
 * (errors, incidents, heartbeats, performance, API keys, notifications).
 * The engine only observes, correlates, explains and recommends — it never
 * mutates user data or code.
 */

export type InsightSeverity = "positive" | "info" | "warning" | "critical";
export type TrendDirection = "improving" | "stable" | "degrading";
export type Priority = "low" | "medium" | "high";
export type BadgeTone = "success" | "warning" | "danger" | "primary" | "default";

export interface HealthScores {
  overall: number;
  reliability: number;
  availability: number;
  security: number;
  performance: number;
  maintainability: number;
}

export interface TrendInfo {
  direction: TrendDirection;
  /** Signed error-rate change vs the comparison window, as a percentage. */
  changePct: number;
  label: string;
  comparedTo: string;
}

export interface SmartBadge {
  label: string;
  tone: BadgeTone;
}

export interface Insight {
  id: string;
  title: string;
  detail: string;
  severity: InsightSeverity;
  /** 0–100. How confident the engine is in this observation. */
  confidence: number;
  evidence: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  priority: Priority;
  /** 0–100. */
  confidence: number;
  reasoning: string;
  evidence: string[];
}

export interface CorrelationEvent {
  at: string;
  label: string;
}

export interface Correlation {
  id: string;
  title: string;
  relationship: string;
  rootEvent: string;
  /** 0–100. */
  confidence: number;
  events: CorrelationEvent[];
}

export type TimelineKind =
  | "deployment"
  | "error"
  | "incident"
  | "ai"
  | "heartbeat"
  | "performance"
  | "notification";

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  title: string;
  detail?: string;
  at: string;
  tone: BadgeTone;
}

export interface WeeklyReport {
  summary: string;
  mostCommonErrors: string[];
  mostUnstableEndpoint: string;
  bestPerformingService: string;
  biggestImprovement: string;
  highestRisk: string;
  recommendations: string[];
}

export interface IntelligenceSummaries {
  executive: string;
  developer: string;
  weekly: WeeklyReport;
}

export interface ProjectIntelligence {
  projectId: string;
  projectName: string;
  framework: string;
  status: string;
  generatedAt: string;
  hasData: boolean;
  scores: HealthScores;
  trend: TrendInfo;
  badges: SmartBadge[];
  insights: Insight[];
  recommendations: Recommendation[];
  correlations: Correlation[];
  timeline: TimelineEvent[];
  summaries: IntelligenceSummaries;
}
