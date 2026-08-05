"use client";

import { motion } from "framer-motion";

import { hasAdminPermission } from "@/services/admin/permissions";
import type { AdminPlatformRole } from "@/services/admin/types";
import type { PlatformSettingsData } from "@/services/admin/platform-settings.types";
import { SectionCard } from "@/features/admin/components/executive/section-card";
import {
  formatRelative,
  formatWhen,
} from "@/features/admin/components/executive/format";
import { FeatureFlagsPanel } from "@/features/admin/components/settings/feature-flags-panel";
import { MetaGrid } from "@/features/admin/components/settings/meta-grid";
import { SystemSettingsPanel } from "@/features/admin/components/settings/system-settings-panel";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-header";
import {
  ADMIN_FADE_UP,
  ADMIN_KPI_STAGGER,
} from "@/features/admin/components/ui/admin-motion";

export function PlatformSettingsCenter({
  data,
  role,
}: {
  data: PlatformSettingsData;
  role: AdminPlatformRole;
}) {
  const canWrite = hasAdminPermission(role, "admin:settings:write");

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Control plane"
        title="Platform Settings & Feature Flags"
        description="Configuration metadata and safe operational controls. Secrets and API keys are never displayed."
      />

      <motion.div
        {...ADMIN_FADE_UP}
        transition={{ ...ADMIN_FADE_UP.transition }}
      >
        <SectionCard
          title="Platform"
          description="Identity, build, and deployment metadata"
        >
          <MetaGrid
            items={[
              {
                label: "Platform name",
                value: data.platform.platformName,
              },
              {
                label: "Version",
                value: data.platform.version,
                hint: "package.json",
              },
              {
                label: "Environment",
                value: data.platform.environment,
              },
              {
                label: "Deployment status",
                value: data.platform.deploymentStatus,
                tone:
                  data.platform.deploymentStatus === "live"
                    ? "green"
                    : data.platform.deploymentStatus === "maintenance"
                      ? "yellow"
                      : "red",
              },
              {
                label: "Build version",
                value: data.platform.buildVersion,
                hint: "Git SHA when available, else app version",
              },
              {
                label: "Build date",
                value: data.platform.buildDate
                  ? formatWhen(data.platform.buildDate)
                  : "—",
                hint: data.platform.buildDateNote ?? undefined,
              },
            ]}
          />
        </SectionCard>
      </motion.div>

      <motion.div
        {...ADMIN_FADE_UP}
        transition={{
          ...ADMIN_FADE_UP.transition,
          delay: ADMIN_KPI_STAGGER,
        }}
      >
        <SectionCard
          title="Feature flags"
          description="Enable, disable, beta, and internal rollout controls"
        >
          <FeatureFlagsPanel flags={data.featureFlags} canWrite={canWrite} />
        </SectionCard>
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="AI settings" description="Provider metadata only">
          <MetaGrid
            items={[
              { label: "Provider", value: data.ai.provider },
              {
                label: "Configured",
                value: data.ai.configured ? "Yes" : "No",
                tone: data.ai.configured ? "green" : "yellow",
              },
              {
                label: "Default model",
                value: data.ai.defaultModel ?? "—",
                hint: data.ai.configured
                  ? "Non-secret model id"
                  : "Hidden until credentials exist",
              },
              {
                label: "Health",
                value: data.ai.healthDetail,
                tone: data.ai.health,
              },
            ]}
          />
        </SectionCard>

        <SectionCard title="Email settings" description="No sender secrets">
          <MetaGrid
            items={[
              {
                label: "Configured",
                value: data.email.configured ? "Yes" : "No",
                tone: data.email.configured ? "green" : "yellow",
              },
              {
                label: "Verified sender",
                value: data.email.verifiedSender,
                hint: "Domain metadata only",
              },
              {
                label: "Delivery status",
                value: data.email.deliveryStatus,
                tone: data.email.deliveryTone,
              },
              {
                label: "Last test",
                value: data.email.lastTestAt
                  ? `${formatRelative(data.email.lastTestAt)} · ${data.email.lastTestStatus}`
                  : "No email deliveries logged",
              },
            ]}
          />
        </SectionCard>

        <SectionCard title="Database" description="Connection health metadata">
          <MetaGrid
            items={[
              {
                label: "Connection status",
                value: data.database.connectionStatus,
                tone: data.database.connectionTone,
              },
              { label: "Region", value: data.database.region },
              {
                label: "Health",
                value: data.database.healthDetail,
                tone: data.database.health,
              },
              {
                label: "Migration version",
                value: data.database.migrationVersion,
                hint: "Latest supabase/migrations file",
              },
              {
                label: "Table count",
                value:
                  data.database.tableCount == null
                    ? "—"
                    : String(data.database.tableCount),
                hint: data.database.tableCountNote ?? "public schema",
              },
            ]}
          />
        </SectionCard>

        <SectionCard title="Storage" description="Bucket status without keys">
          <MetaGrid
            items={[
              { label: "Provider", value: data.storage.provider },
              {
                label: "Bucket status",
                value: data.storage.bucketStatus,
                tone: data.storage.bucketTone,
              },
              {
                label: "Usage",
                value: data.storage.usage,
                hint: data.storage.usageAvailable
                  ? undefined
                  : "Honest gap — management API not connected",
              },
            ]}
          />
          {data.storage.buckets.length > 0 ? (
            <ul className="mt-3 space-y-1 text-xs text-[var(--admin-muted)]">
              {data.storage.buckets.map((bucket) => (
                <li key={bucket.name}>
                  {bucket.name} · {bucket.public ? "public" : "private"}
                </li>
              ))}
            </ul>
          ) : null}
        </SectionCard>

        <SectionCard title="SDK" description="Package and heartbeat signals">
          <MetaGrid
            items={[
              {
                label: "Latest version",
                value: data.sdk.latestVersion,
                hint: "@zynteksis/sdk package",
              },
              {
                label: "Supported versions",
                value:
                  data.sdk.supportedVersions.length > 0
                    ? data.sdk.supportedVersions.join(", ")
                    : "—",
                hint: "Package version + releases seen in heartbeats (1h)",
              },
              {
                label: "Downloads",
                value:
                  data.sdk.downloads == null
                    ? "—"
                    : String(data.sdk.downloads),
                hint: data.sdk.downloadsNote ?? undefined,
              },
              {
                label: "Health",
                value: data.sdk.healthDetail,
                tone: data.sdk.health,
              },
            ]}
          />
        </SectionCard>

        <SectionCard title="Cron" description="Registered jobs from registry">
          <MetaGrid
            items={[
              {
                label: "Registered jobs",
                value: String(data.cron.registeredJobs.length),
              },
              {
                label: "CRON_SECRET",
                value: data.cron.cronSecretConfigured
                  ? "Configured"
                  : "Not configured",
                tone: data.cron.cronSecretConfigured ? "green" : "yellow",
                hint: "Presence only — value never shown",
              },
              {
                label: "Vercel schedules",
                value: data.cron.vercelCronsConfigured
                  ? "Configured"
                  : "Empty (vercel.json)",
                tone: "yellow",
              },
              {
                label: "Health",
                value: data.cron.healthDetail,
                tone: data.cron.health,
              },
            ]}
          />
          <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--admin-border)]">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[var(--admin-surface)] text-[11px] uppercase tracking-wide text-[var(--admin-muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Job</th>
                  <th className="px-3 py-2 font-medium">Enabled</th>
                  <th className="px-3 py-2 font-medium">Schedule</th>
                  <th className="px-3 py-2 font-medium">Last run</th>
                </tr>
              </thead>
              <tbody>
                {data.cron.registeredJobs.map((job) => (
                  <tr
                    key={job.name}
                    className="border-t border-[var(--admin-border)] text-[var(--admin-text)]"
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium">{job.name}</p>
                      <p className="text-[var(--admin-muted)]">{job.path}</p>
                    </td>
                    <td className="px-3 py-2">
                      {job.enabled ? "Yes" : "No"}
                    </td>
                    <td className="px-3 py-2 font-mono">{job.schedule}</td>
                    <td className="px-3 py-2 text-[var(--admin-muted)]">
                      {job.lastRun ? formatRelative(job.lastRun) : "Not stored"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Security settings"
        description="Policy metadata — no secrets"
      >
        <MetaGrid
          items={[
            {
              label: "Password policy",
              value: `Min ${data.security.passwordPolicy.minLength}, max ${data.security.passwordPolicy.maxLength}; lower/upper/number required`,
              hint: data.security.passwordPolicy.source,
            },
            {
              label: "Session timeout",
              value: `${data.security.sessionTimeoutHours} hours`,
              hint: data.security.sessionTimeoutNote,
            },
            {
              label: "MFA status",
              value: data.security.mfaStatus,
            },
            {
              label: "Rate limiting",
              value: data.security.rateLimitingStatus,
              tone: data.security.rateLimitingTone,
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="System settings"
        description="Maintenance mode and registration gate"
      >
        <SystemSettingsPanel
          system={data.system}
          security={data.security}
          platformName={data.platform.platformName}
          canWrite={canWrite}
        />
      </SectionCard>

      {data.unavailable.length > 0 ? (
        <p className="text-xs text-[var(--admin-muted)]">
          Honest gaps: {data.unavailable.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
