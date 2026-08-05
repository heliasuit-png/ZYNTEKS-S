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
  buildDateNote: string | null;
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
  healthDetail: string;
}

export interface EmailSettingsMeta {
  configured: boolean;
  verifiedSender: string;
  deliveryStatus: string;
  deliveryTone: HealthTone;
  lastTestAt: string | null;
  lastTestStatus: string | null;
}

export interface DatabaseSettingsMeta {
  connectionStatus: string;
  connectionTone: HealthTone;
  region: string;
  health: HealthTone;
  healthDetail: string;
  migrationVersion: string;
  tableCount: number | null;
  tableCountNote: string | null;
  latencyMs: number | null;
}

export interface StorageSettingsMeta {
  provider: string;
  bucketStatus: string;
  bucketTone: HealthTone;
  buckets: { name: string; public: boolean }[];
  usage: string;
  usageAvailable: boolean;
}

export interface SdkSettingsMeta {
  latestVersion: string;
  supportedVersions: string[];
  downloads: number | null;
  downloadsNote: string | null;
  health: HealthTone;
  healthDetail: string;
}

export interface CronJobMeta {
  name: string;
  schedule: string;
  path: string;
  enabled: boolean;
  lastRun: string | null;
  health: HealthTone;
  note: string;
}

export interface CronSettingsMeta {
  registeredJobs: CronJobMeta[];
  cronSecretConfigured: boolean;
  vercelCronsConfigured: boolean;
  health: HealthTone;
  healthDetail: string;
}

export interface SecuritySettingsMeta {
  passwordPolicy: {
    minLength: number;
    requireLowercase: boolean;
    requireUppercase: boolean;
    requireNumber: boolean;
    maxLength: number;
    source: string;
  };
  sessionTimeoutHours: number;
  sessionTimeoutNote: string;
  mfaStatus: string;
  mfaRequired: boolean;
  rateLimitingStatus: string;
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
