import type { Json } from "@/types/database";
import type { ErrorEvent, ErrorLevel } from "@/types/dashboard";

export interface ErrorDetail extends ErrorEvent {
  stack: string | null;
  browser: Json | null;
  os: Json | null;
  device: Json | null;
  screen: Json | null;
  language: string | null;
  timezone: string | null;
  performance: Json | null;
  network: Json | null;
  memory: Json | null;
  framework: string | null;
  sdkVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RelatedErrorSummary {
  id: string;
  message: string;
  level: ErrorLevel;
  occurrences: number;
  lastSeenAt: string;
  fingerprint: string;
}

export interface RelatedIncidentSummary {
  id: string;
  title: string;
  status: string;
  severity: string;
  startedAt: string;
  resolvedAt: string | null;
}

export interface ErrorTimelineEvent {
  id: string;
  at: string;
  title: string;
  detail?: string;
  tone: "danger" | "warning" | "primary" | "success" | "default";
}

export interface ErrorAnalytics {
  totalGroups: number;
  totalOccurrences: number;
  byLevel: { level: ErrorLevel; count: number }[];
  byEnvironment: { environment: string; count: number }[];
  unresolvedCount: number;
  resolvedCount: number;
}

export interface ErrorDetailBundle {
  error: ErrorDetail;
  relatedErrors: RelatedErrorSummary[];
  relatedIncidents: RelatedIncidentSummary[];
  timeline: ErrorTimelineEvent[];
  apiKeyHints: string[];
}
