import type {
  FeatureFlagScope,
  FeatureFlagStatus,
} from "@/types/database";
import type { HealthTone } from "@/services/admin/executive-dashboard.types";

export interface PlatformIdentity {
  platformName: string;
  version: string;
  environment: string;
  deploymentStatus: "live" | "maintenance" | "degraded";
  buildVersion: string;
  buildDate: string | null;
  buildDateNoteKey: "missing" | null;
}

export interface FeatureFlagRow {
  id: string;
  key: string;
  name: string;
  description: string;
  scope: FeatureFlagScope;
  status: FeatureFlagStatus;
  updatedAt: string;
  updatedBy: string | null;
}

export interface AiSettingsMeta {
  provider: string;
  configured: boolean;
  defaultModel: string | null;
  health: HealthTone;
  healthDetailKey: "configured" | "not_configured";
}

export interface EmailSettingsMeta {
  configured: boolean;
  verifiedSenderKey: "not_configured" | "configured" | "domain";
  verifiedSenderDomain: string | null;
  deliveryKey: "not_configured" | "ok" | "failed";
  deliverySent: number;
  deliveryFailed: number;
  deliveryTone: HealthTone;
  lastTestAt: string | null;
  lastTestStatus: string | null;
}

export interface DatabaseSettingsMeta {
  connectionStatusKey: "connected" | "unreachable";
  connectionTone: HealthTone;
  regionKey: "value" | "not_exposed" | "unavailable";
  regionValue: string | null;
  health: HealthTone;
  healthDetailKey: "reachable_ms" | "error";
  healthDetailMs: number | null;
  healthDetailMessage: string | null;
  migrationVersion: string;
  tableCount: number | null;
  tableCountNoteKey: "unavailable" | null;
  latencyMs: number | null;
}

export interface StorageSettingsMeta {
  provider: string;
  bucketStatusKey: "unavailable" | "error" | "missing" | "ok";
  bucketTone: HealthTone;
  bucketCount: number | null;
  bucketMissing: string | null;
  bucketErrorMessage: string | null;
  buckets: { name: string; public: boolean }[];
  usageAvailable: boolean;
}

export interface SdkSettingsMeta {
  latestVersion: string;
  supportedVersions: string[];
  downloads: number | null;
  downloadsNoteKey: "unavailable" | null;
  health: HealthTone;
  healthDetailKey: "silent" | "heartbeats";
  healthDetailCount: number | null;
}

export interface CronJobMeta {
  name: string;
  schedule: string;
  path: string;
  enabled: boolean;
  lastRun: string | null;
  health: HealthTone;
}

export interface CronSettingsMeta {
  registeredJobs: CronJobMeta[];
  cronSecretConfigured: boolean;
  vercelCronsConfigured: boolean;
  health: HealthTone;
  healthDetailKey: "ok" | "missing_secret" | "no_jobs";
  healthDetailJobCount: number | null;
}

export interface SecuritySettingsMeta {
  passwordPolicy: {
    minLength: number;
    requireLowercase: boolean;
    requireUppercase: boolean;
    requireNumber: boolean;
    maxLength: number;
  };
  sessionTimeoutHours: number;
  mfaRequired: boolean;
  rateLimitingMaxPerMin: number;
  rateLimitingTone: HealthTone;
}

export interface SystemSettingsMeta {
  maintenanceEnabled: boolean;
  maintenanceMessage: string | null;
  registrationEnabled: boolean;
  updatedAt: string;
}

export interface PlatformSettingsData {
  platform: PlatformIdentity;
  featureFlags: FeatureFlagRow[];
  ai: AiSettingsMeta;
  email: EmailSettingsMeta;
  database: DatabaseSettingsMeta;
  storage: StorageSettingsMeta;
  sdk: SdkSettingsMeta;
  cron: CronSettingsMeta;
  security: SecuritySettingsMeta;
  system: SystemSettingsMeta;
  unavailable: string[];
}
