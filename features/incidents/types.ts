import type {
  IncidentSeverity,
  IncidentStatus,
} from "@/types/database";

export type IncidentActionStatus = "idle" | "success" | "error";

export interface IncidentActionState {
  status: IncidentActionStatus;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialIncidentActionState: IncidentActionState = {
  status: "idle",
};

export interface RelatedErrorSummary {
  id: string;
  message: string;
  level: string;
  occurrences: number;
  lastSeenAt: string;
}

export interface RelatedHeartbeatSummary {
  id: string;
  occurredAt: string;
  environment: string;
  release: string | null;
  page: string | null;
}

export interface RelatedNotificationSummary {
  id: string;
  title: string;
  type: string;
  channel: string;
  createdAt: string;
}

export interface RelatedPerfSummary {
  id: string;
  occurredAt: string;
  url: string | null;
  lcp: number | null;
  ttfb: number | null;
  pageLoad: number | null;
}

export interface RelatedApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  environment: string;
  lastUsedAt: string | null;
}

export interface RelatedAiSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface RootCauseAnalysis {
  possibleCause: string;
  confidence: number;
  evidence: string[];
  relatedEvents: string[];
  recommendations: string[];
}

export interface RecoveryStats {
  downtimeSeconds: number | null;
  recoverySeconds: number | null;
  averageRecoverySeconds: number | null;
  historicalCount: number;
}

export interface EnrichedTimelineEvent {
  id: string;
  at: string;
  title: string;
  detail?: string;
  kind:
    | "created"
    | "error"
    | "heartbeat"
    | "notification"
    | "ai"
    | "status"
    | "resolved"
    | "recovery"
    | "comment";
  tone: "danger" | "warning" | "primary" | "success" | "default";
}

export interface IncidentDetailBundle {
  incident: {
    id: string;
    title: string;
    description: string | null;
    status: IncidentStatus;
    severity: IncidentSeverity;
    source: string;
    projectId: string;
    projectName: string;
    environment: string | null;
    startedAt: string;
    detectedAt: string;
    resolvedAt: string | null;
    downtimeSeconds: number | null;
    lastHeartbeatAt: string | null;
    autoResolved: boolean;
    assignee: string;
  };
  updates: {
    id: string;
    status: IncidentStatus | null;
    message: string;
    createdAt: string;
  }[];
  timeline: EnrichedTimelineEvent[];
  relatedErrors: RelatedErrorSummary[];
  relatedHeartbeats: RelatedHeartbeatSummary[];
  relatedNotifications: RelatedNotificationSummary[];
  relatedPerformance: RelatedPerfSummary[];
  relatedApiKeys: RelatedApiKeySummary[];
  relatedAi: RelatedAiSummary[];
  rootCause: RootCauseAnalysis;
  recovery: RecoveryStats;
  aiAnalyzeHref: string;
}
