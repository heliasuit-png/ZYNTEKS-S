import "server-only";

import { readdirSync } from "node:fs";
import { join } from "node:path";

import { cronJobs } from "@/cron/registry";
import { SDK_INGEST } from "@/lib/constants";
import { env } from "@/lib/env";
import { NotFoundError } from "@/lib/errors";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { assertAdminPermission } from "@/services/admin/permissions";
import type { HealthTone } from "@/services/admin/executive-dashboard.types";
import type { PlatformSettingsData } from "@/services/admin/platform-settings.types";
import type { AdminPlatformRole } from "@/services/admin/types";
import { createSupabaseAdminClient } from "@/supabase/admin";

import appPackage from "@/package.json";
import sdkPackage from "@/sdk/package.json";

const REQUIRED_BUCKETS = ["avatars", "workspace-logos"] as const;

function readLatestMigrationVersion(): string {
  try {
    const dir = join(process.cwd(), "supabase", "migrations");
    const files = readdirSync(dir)
      .filter((name) => /^\d{4}_.+\.sql$/i.test(name))
      .sort();
    const latest = files.at(-1);
    return latest ? latest.replace(/\.sql$/i, "") : "unknown";
  } catch {
    return "unavailable";
  }
}

function resolveBuildMeta(): {
  buildVersion: string;
  buildDate: string | null;
  buildDateNoteKey: "missing" | null;
  environment: string;
} {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GITHUB_SHA?.trim() ||
    "";
  const buildVersion = sha ? sha.slice(0, 7) : appPackage.version;
  const buildDate =
    process.env.VERCEL_GIT_COMMIT_TIMESTAMP?.trim() ||
    process.env.BUILD_TIMESTAMP?.trim() ||
    null;
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  const environment = vercelEnv || env.NODE_ENV;
  return {
    buildVersion,
    buildDate,
    buildDateNoteKey: buildDate ? null : "missing",
    environment,
  };
}

function resolveDatabaseRegion(): {
  regionKey: "value" | "not_exposed" | "unavailable";
  regionValue: string | null;
} {
  const explicit =
    process.env.SUPABASE_REGION?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_REGION?.trim();
  if (explicit) return { regionKey: "value", regionValue: explicit };
  try {
    const host = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname;
    // Newer Supabase hosts embed region (e.g. aws-0-eu-central-1.pooler.supabase.com)
    const match = host.match(
      /(?:^|\.)((?:aws|us|eu|ap|sa|ca|af)-[a-z0-9-]+)\./i,
    );
    if (match?.[1]) return { regionKey: "value", regionValue: match[1] };
    return { regionKey: "not_exposed", regionValue: null };
  } catch {
    return { regionKey: "unavailable", regionValue: null };
  }
}

function senderDomainMeta(fromConfigured: boolean): {
  verifiedSenderKey: "not_configured" | "configured" | "domain";
  verifiedSenderDomain: string | null;
} {
  if (!fromConfigured) {
    return { verifiedSenderKey: "not_configured", verifiedSenderDomain: null };
  }
  try {
    const raw = env.EMAIL_FROM;
    // Prefer RFC-style "Name <email@domain>" or bare email — never return full secret value.
    const angle = raw.match(/<([^>]+)>/);
    const address = (angle?.[1] ?? raw).trim();
    const at = address.lastIndexOf("@");
    if (at <= 0 || at === address.length - 1) {
      return { verifiedSenderKey: "configured", verifiedSenderDomain: null };
    }
    const domain = address.slice(at + 1);
    return { verifiedSenderKey: "domain", verifiedSenderDomain: domain };
  } catch {
    return { verifiedSenderKey: "configured", verifiedSenderDomain: null };
  }
}

export async function getPlatformSettingsCenter(
  role: AdminPlatformRole,
): Promise<PlatformSettingsData> {
  assertAdminPermission(role, "admin:settings:read");

  const admin = createSupabaseAdminClient();
  const unavailable: string[] = [];
  const build = resolveBuildMeta();
  const migrationVersion = readLatestMigrationVersion();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [
    settingsRes,
    flagsRes,
    mailFailedRes,
    mailLastRes,
    mailOkRes,
    heartbeatRes,
    tableCountRes,
  ] = await Promise.all([
    admin
      .from("platform_settings")
      .select(
        "platform_name, maintenance_enabled, maintenance_message, registration_enabled, password_min_length, session_timeout_hours, mfa_required, updated_at",
      )
      .eq("id", 1)
      .maybeSingle(),
    admin
      .from("feature_flags")
      .select(
        "id, key, name, description, scope, status, updated_at, updated_by",
      )
      .order("key", { ascending: true }),
    admin
      .from("notification_logs")
      .select("id", { count: "exact", head: true })
      .eq("channel", "email")
      .eq("status", "failed")
      .gte("created_at", dayAgo),
    admin
      .from("notification_logs")
      .select("created_at, status")
      .eq("channel", "email")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("notification_logs")
      .select("id", { count: "exact", head: true })
      .eq("channel", "email")
      .eq("status", "sent")
      .gte("created_at", dayAgo),
    admin
      .from("heartbeats")
      .select("release, occurred_at")
      .gte("occurred_at", hourAgo)
      .limit(2000),
    admin.rpc("admin_platform_table_count"),
  ]);

  if (settingsRes.error) throw mapPostgrestError(settingsRes.error);
  if (flagsRes.error) throw mapPostgrestError(flagsRes.error);
  if (mailFailedRes.error) throw mapPostgrestError(mailFailedRes.error);
  if (mailLastRes.error) throw mapPostgrestError(mailLastRes.error);
  if (mailOkRes.error) throw mapPostgrestError(mailOkRes.error);
  if (heartbeatRes.error) throw mapPostgrestError(heartbeatRes.error);

  const settings = settingsRes.data;
  if (!settings) {
    throw new NotFoundError(
      "platform_settings singleton missing — apply migration 0013",
    );
  }

  // Database probe
  let databaseTone: HealthTone = "green";
  let databaseHealthDetailKey: "reachable_ms" | "error" = "reachable_ms";
  let databaseHealthDetailMs: number | null = null;
  let databaseHealthDetailMessage: string | null = null;
  let latencyMs: number | null = null;
  try {
    const started = performance.now();
    const { error } = await admin.from("profiles").select("id").limit(1);
    latencyMs = Math.round(performance.now() - started);
    if (error) {
      databaseTone = "red";
      databaseHealthDetailKey = "error";
      databaseHealthDetailMessage = error.message;
    } else {
      databaseHealthDetailKey = "reachable_ms";
      databaseHealthDetailMs = latencyMs;
    }
  } catch (error) {
    databaseTone = "red";
    databaseHealthDetailKey = "error";
    databaseHealthDetailMessage =
      error instanceof Error ? error.message : "Database unreachable";
  }

  let tableCount: number | null = null;
  let tableCountNoteKey: "unavailable" | null = null;
  if (tableCountRes.error) {
    tableCountNoteKey = "unavailable";
    unavailable.push("database_table_count");
  } else if (typeof tableCountRes.data === "number") {
    tableCount = tableCountRes.data;
  }

  // Storage probe
  let bucketTone: HealthTone = "yellow";
  let bucketStatusKey: "unavailable" | "error" | "missing" | "ok" =
    "unavailable";
  let bucketCount: number | null = null;
  let bucketMissing: string | null = null;
  let bucketErrorMessage: string | null = null;
  let buckets: { name: string; public: boolean }[] = [];
  try {
    const { data, error } = await admin.storage.listBuckets();
    if (error) {
      bucketTone = "red";
      bucketStatusKey = "error";
      bucketErrorMessage = error.message;
    } else {
      buckets = (data ?? []).map((bucket) => ({
        name: bucket.name,
        public: Boolean(bucket.public),
      }));
      const names = new Set(buckets.map((b) => b.name));
      const missing = REQUIRED_BUCKETS.filter((name) => !names.has(name));
      if (missing.length > 0) {
        bucketTone = "yellow";
        bucketStatusKey = "missing";
        bucketMissing = missing.join(", ");
      } else {
        bucketTone = "green";
        bucketStatusKey = "ok";
        bucketCount = buckets.length;
      }
    }
  } catch (error) {
    bucketTone = "red";
    bucketStatusKey = "error";
    bucketErrorMessage =
      error instanceof Error ? error.message : "Storage unreachable";
  }

  unavailable.push("storage_usage_bytes");

  // AI
  const openaiConfigured = Boolean(env.OPENAI_API_KEY);
  const aiTone: HealthTone = openaiConfigured ? "green" : "yellow";

  // Email — never expose EMAIL_FROM / API keys
  const resendConfigured = Boolean(env.RESEND_API_KEY);
  const fromConfigured = Boolean(env.EMAIL_FROM);
  const emailConfigured = resendConfigured && fromConfigured;
  const mailFailed = mailFailedRes.count ?? 0;
  const mailSent = mailOkRes.count ?? 0;
  let deliveryTone: HealthTone = emailConfigured ? "green" : "yellow";
  let deliveryKey: "not_configured" | "ok" | "failed" = emailConfigured
    ? "ok"
    : "not_configured";
  if (mailFailed > 0) {
    deliveryTone = "red";
    deliveryKey = "failed";
  }

  // SDK
  const packageSdkVersion = sdkPackage.version;
  const releaseSet = new Set<string>();
  for (const row of heartbeatRes.data ?? []) {
    const release = row.release?.trim();
    if (release) releaseSet.add(release);
  }
  releaseSet.add(packageSdkVersion);
  const supportedVersions = [...releaseSet].sort();
  const hbCount = heartbeatRes.data?.length ?? 0;
  let sdkTone: HealthTone = "yellow";
  let sdkHealthDetailKey: "silent" | "heartbeats" = "silent";
  let sdkHealthDetailCount: number | null = null;
  if (hbCount > 0) {
    sdkTone = "green";
    sdkHealthDetailKey = "heartbeats";
    sdkHealthDetailCount = hbCount;
  }
  unavailable.push("sdk_npm_downloads");

  // Cron — registry must stay aligned with vercel.json (health + monitor).
  const cronSecretConfigured = Boolean(env.CRON_SECRET);
  const vercelCronsConfigured = cronJobs.length > 0;
  let cronTone: HealthTone =
    cronSecretConfigured && vercelCronsConfigured ? "green" : "yellow";
  let cronHealthDetailKey: "ok" | "missing_secret" | "no_jobs" =
    cronSecretConfigured ? "ok" : "missing_secret";
  let cronHealthDetailJobCount: number | null = cronSecretConfigured
    ? cronJobs.length
    : null;
  if (!vercelCronsConfigured) {
    cronTone = "yellow";
    cronHealthDetailKey = "no_jobs";
    cronHealthDetailJobCount = null;
  }
  unavailable.push("cron_history");

  const deploymentStatus = settings.maintenance_enabled
    ? "maintenance"
    : databaseTone === "red"
      ? "degraded"
      : "live";

  const region = resolveDatabaseRegion();
  const sender = senderDomainMeta(fromConfigured);

  return {
    platform: {
      platformName: settings.platform_name,
      version: appPackage.version,
      environment: build.environment,
      deploymentStatus,
      buildVersion: build.buildVersion,
      buildDate: build.buildDate,
      buildDateNoteKey: build.buildDateNoteKey,
    },
    featureFlags: (flagsRes.data ?? []).map((row) => ({
      id: row.id,
      key: row.key,
      name: row.name,
      description: row.description,
      scope: row.scope,
      status: row.status,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    })),
    ai: {
      provider: "OpenAI",
      configured: openaiConfigured,
      defaultModel: openaiConfigured ? env.OPENAI_MODEL : null,
      health: aiTone,
      healthDetailKey: openaiConfigured ? "configured" : "not_configured",
    },
    email: {
      configured: emailConfigured,
      verifiedSenderKey: sender.verifiedSenderKey,
      verifiedSenderDomain: sender.verifiedSenderDomain,
      deliveryKey,
      deliverySent: mailSent,
      deliveryFailed: mailFailed,
      deliveryTone,
      lastTestAt: mailLastRes.data?.created_at ?? null,
      lastTestStatus: mailLastRes.data?.status ?? null,
    },
    database: {
      connectionStatusKey:
        databaseTone === "green" ? "connected" : "unreachable",
      connectionTone: databaseTone,
      regionKey: region.regionKey,
      regionValue: region.regionValue,
      health: databaseTone,
      healthDetailKey: databaseHealthDetailKey,
      healthDetailMs: databaseHealthDetailMs,
      healthDetailMessage: databaseHealthDetailMessage,
      migrationVersion,
      tableCount,
      tableCountNoteKey,
      latencyMs,
    },
    storage: {
      provider: "Supabase Storage",
      bucketStatusKey,
      bucketTone,
      bucketCount,
      bucketMissing,
      bucketErrorMessage,
      buckets,
      usageAvailable: false,
    },
    sdk: {
      latestVersion: packageSdkVersion,
      supportedVersions,
      downloads: null,
      downloadsNoteKey: "unavailable",
      health: sdkTone,
      healthDetailKey: sdkHealthDetailKey,
      healthDetailCount: sdkHealthDetailCount,
    },
    cron: {
      registeredJobs: cronJobs.map((job) => ({
        name: job.name,
        schedule: job.schedule,
        path: job.path,
        enabled: cronSecretConfigured,
        lastRun: null,
        health: cronSecretConfigured ? "yellow" : "yellow",
      })),
      cronSecretConfigured,
      vercelCronsConfigured,
      health: cronTone,
      healthDetailKey: cronHealthDetailKey,
      healthDetailJobCount: cronHealthDetailJobCount,
    },
    security: {
      passwordPolicy: {
        minLength: settings.password_min_length,
        requireLowercase: true,
        requireUppercase: true,
        requireNumber: true,
        maxLength: 72,
      },
      sessionTimeoutHours: settings.session_timeout_hours,
      mfaRequired: settings.mfa_required,
      rateLimitingMaxPerMin: SDK_INGEST.rateLimit.max,
      rateLimitingTone: "green",
    },
    system: {
      maintenanceEnabled: settings.maintenance_enabled,
      maintenanceMessage: settings.maintenance_message,
      registrationEnabled: settings.registration_enabled,
      updatedAt: settings.updated_at,
    },
    unavailable,
  };
}
