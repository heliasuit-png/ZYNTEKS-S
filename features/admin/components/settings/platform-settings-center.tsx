"use client";

import { motion } from "framer-motion";

import { useDictionary } from "@/components/i18n/locale-provider";
import { fillTemplate } from "@/lib/i18n/fill-template";
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
  const { dict, locale } = useDictionary();
  const t = dict.admin.settings;
  const common = dict.admin.common;
  const canWrite = hasAdminPermission(role, "admin:settings:write");

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow={t.eyebrow}
        title={t.pageTitle}
        description={t.description}
      />

      <motion.div
        {...ADMIN_FADE_UP}
        transition={{ ...ADMIN_FADE_UP.transition }}
      >
        <SectionCard
          title={t.sections.platform}
          description={t.sections.platformDesc}
        >
          <MetaGrid
            items={[
              {
                label: t.meta.platformName,
                value: data.platform.platformName,
              },
              {
                label: t.meta.version,
                value: data.platform.version,
                hint: "package.json",
              },
              {
                label: t.meta.environment,
                value: data.platform.environment,
              },
              {
                label: t.meta.deploymentStatus,
                value: data.platform.deploymentStatus,
                tone:
                  data.platform.deploymentStatus === "live"
                    ? "green"
                    : data.platform.deploymentStatus === "maintenance"
                      ? "yellow"
                      : "red",
              },
              {
                label: t.meta.buildVersion,
                value: data.platform.buildVersion,
                hint: t.meta.buildVersionHint,
              },
              {
                label: t.meta.buildDate,
                value: data.platform.buildDate
                  ? formatWhen(data.platform.buildDate)
                  : "—",
                hint:
                  data.platform.buildDateNoteKey === "missing"
                    ? t.notes.buildDateMissing
                    : undefined,
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
          title={t.featureFlags}
          description={t.featureFlagsDesc}
        >
          <FeatureFlagsPanel flags={data.featureFlags} canWrite={canWrite} />
        </SectionCard>
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title={t.sections.ai} description={t.sections.aiDesc}>
          <MetaGrid
            items={[
              { label: t.meta.provider, value: data.ai.provider },
              {
                label: t.meta.configured,
                value: data.ai.configured ? common.yes : common.no,
                tone: data.ai.configured ? "green" : "yellow",
              },
              {
                label: t.meta.defaultModel,
                value: data.ai.defaultModel ?? "—",
                hint: data.ai.configured
                  ? t.meta.defaultModelHint
                  : t.meta.defaultModelHidden,
              },
              {
                label: t.meta.health,
                value:
                  data.ai.healthDetailKey === "configured"
                    ? t.notes.aiConfigured
                    : t.notes.aiNotConfigured,
                tone: data.ai.health,
              },
            ]}
          />
        </SectionCard>

        <SectionCard title={t.sections.email} description={t.sections.emailDesc}>
          <MetaGrid
            items={[
              {
                label: t.meta.configured,
                value: data.email.configured ? common.yes : common.no,
                tone: data.email.configured ? "green" : "yellow",
              },
              {
                label: t.meta.verifiedSender,
                value:
                  data.email.verifiedSenderKey === "domain"
                    ? fillTemplate(t.notes.senderDomain, {
                        domain: data.email.verifiedSenderDomain ?? "",
                      })
                    : data.email.verifiedSenderKey === "configured"
                      ? t.notes.senderConfigured
                      : t.notes.senderNotConfigured,
                hint: t.meta.verifiedSenderHint,
              },
              {
                label: t.meta.deliveryStatus,
                value:
                  data.email.deliveryKey === "not_configured"
                    ? t.notes.emailNotConfigured
                    : data.email.deliveryKey === "failed"
                      ? fillTemplate(t.notes.emailDeliveryFailed, {
                          failed: data.email.deliveryFailed,
                          sent: data.email.deliverySent,
                        })
                      : fillTemplate(t.notes.emailDeliveryOk, {
                          sent: data.email.deliverySent,
                          failed: data.email.deliveryFailed,
                        }),
                tone: data.email.deliveryTone,
              },
              {
                label: t.meta.lastTest,
                value: data.email.lastTestAt
                  ? `${formatRelative(data.email.lastTestAt, locale)} · ${data.email.lastTestStatus}`
                  : t.meta.noEmailDeliveries,
              },
            ]}
          />
        </SectionCard>

        <SectionCard title={t.sections.database} description={t.sections.databaseDesc}>
          <MetaGrid
            items={[
              {
                label: t.meta.connectionStatus,
                value:
                  data.database.connectionStatusKey === "connected"
                    ? t.notes.dbConnected
                    : t.notes.dbUnreachable,
                tone: data.database.connectionTone,
              },
              {
                label: t.meta.region,
                value:
                  data.database.regionKey === "value"
                    ? (data.database.regionValue ?? "—")
                    : data.database.regionKey === "not_exposed"
                      ? t.notes.regionNotExposed
                      : t.notes.regionUnavailable,
              },
              {
                label: t.meta.health,
                value:
                  data.database.healthDetailKey === "reachable_ms"
                    ? fillTemplate(t.notes.dbReachableMs, {
                        ms: data.database.healthDetailMs ?? 0,
                      })
                    : (data.database.healthDetailMessage ?? "—"),
                tone: data.database.health,
              },
              {
                label: t.meta.migrationVersion,
                value: data.database.migrationVersion,
                hint: t.meta.migrationHint,
              },
              {
                label: t.meta.tableCount,
                value:
                  data.database.tableCount == null
                    ? "—"
                    : String(data.database.tableCount),
                hint:
                  data.database.tableCountNoteKey === "unavailable"
                    ? t.notes.tableCountUnavailable
                    : t.meta.publicSchema,
              },
            ]}
          />
        </SectionCard>

        <SectionCard title={t.sections.storage} description={t.sections.storageDesc}>
          <MetaGrid
            items={[
              { label: t.meta.provider, value: data.storage.provider },
              {
                label: t.meta.bucketStatus,
                value:
                  data.storage.bucketStatusKey === "ok"
                    ? fillTemplate(t.notes.bucketsOk, {
                        count: data.storage.bucketCount ?? 0,
                      })
                    : data.storage.bucketStatusKey === "missing"
                      ? fillTemplate(t.notes.bucketsMissing, {
                          missing: data.storage.bucketMissing ?? "",
                        })
                      : data.storage.bucketStatusKey === "error"
                        ? (data.storage.bucketErrorMessage ?? "—")
                        : t.notes.bucketsUnavailable,
                tone: data.storage.bucketTone,
              },
              {
                label: t.meta.usage,
                value: data.storage.usageAvailable
                  ? "—"
                  : t.notes.storageUsageUnavailable,
                hint: data.storage.usageAvailable
                  ? undefined
                  : t.meta.storageGap,
              },
            ]}
          />
          {data.storage.buckets.length > 0 ? (
            <ul className="mt-3 space-y-1 text-xs text-[var(--admin-muted)]">
              {data.storage.buckets.map((bucket) => (
                <li key={bucket.name}>
                  {bucket.name} ·{" "}
                  {bucket.public ? t.meta.publicAccess : t.meta.privateAccess}
                </li>
              ))}
            </ul>
          ) : null}
        </SectionCard>

        <SectionCard title={t.sections.sdk} description={t.sections.sdkDesc}>
          <MetaGrid
            items={[
              {
                label: t.meta.latestVersion,
                value: data.sdk.latestVersion,
                hint: t.meta.sdkPackageHint,
              },
              {
                label: t.meta.supportedVersions,
                value:
                  data.sdk.supportedVersions.length > 0
                    ? data.sdk.supportedVersions.join(", ")
                    : "—",
                hint: t.meta.sdkVersionsHint,
              },
              {
                label: t.meta.downloads,
                value:
                  data.sdk.downloads == null
                    ? "—"
                    : String(data.sdk.downloads),
                hint:
                  data.sdk.downloadsNoteKey === "unavailable"
                    ? t.notes.downloadsUnavailable
                    : undefined,
              },
              {
                label: t.meta.health,
                value:
                  data.sdk.healthDetailKey === "heartbeats"
                    ? fillTemplate(t.notes.sdkHeartbeats, {
                        count: data.sdk.healthDetailCount ?? 0,
                      })
                    : t.notes.sdkSilent,
                tone: data.sdk.health,
              },
            ]}
          />
        </SectionCard>

        <SectionCard title={t.sections.cron} description={t.sections.cronDesc}>
          <MetaGrid
            items={[
              {
                label: t.meta.registeredJobs,
                value: String(data.cron.registeredJobs.length),
              },
              {
                label: t.meta.cronSecret,
                value: data.cron.cronSecretConfigured
                  ? common.configured
                  : common.notConfigured,
                tone: data.cron.cronSecretConfigured ? "green" : "yellow",
                hint: t.meta.cronSecretHint,
              },
              {
                label: t.meta.vercelSchedules,
                value: data.cron.vercelCronsConfigured
                  ? common.configured
                  : t.meta.vercelEmpty,
                tone: "yellow",
              },
              {
                label: t.meta.health,
                value:
                  data.cron.healthDetailKey === "ok"
                    ? fillTemplate(t.notes.cronOk, {
                        count: data.cron.healthDetailJobCount ?? 0,
                      })
                    : data.cron.healthDetailKey === "no_jobs"
                      ? t.notes.cronNoJobs
                      : t.notes.cronMissingSecret,
                tone: data.cron.health,
              },
            ]}
          />
          <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--admin-border)]">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[var(--admin-surface)] text-[11px] uppercase tracking-wide text-[var(--admin-muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">{t.meta.job}</th>
                  <th className="px-3 py-2 font-medium">{t.meta.enabled}</th>
                  <th className="px-3 py-2 font-medium">{t.meta.schedule}</th>
                  <th className="px-3 py-2 font-medium">{t.meta.lastRun}</th>
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
                      {job.enabled ? common.yes : common.no}
                    </td>
                    <td className="px-3 py-2 font-mono">{job.schedule}</td>
                    <td className="px-3 py-2 text-[var(--admin-muted)]">
                      {job.lastRun
                        ? formatRelative(job.lastRun, locale)
                        : common.notStored}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={t.sections.security}
        description={t.sections.securityDesc}
      >
        <MetaGrid
          items={[
            {
              label: t.meta.passwordPolicy,
              value: fillTemplate(t.notes.passwordPolicyValue, {
                min: data.security.passwordPolicy.minLength,
                max: data.security.passwordPolicy.maxLength,
              }),
              hint: t.notes.passwordPolicySource,
            },
            {
              label: t.meta.sessionTimeout,
              value: fillTemplate(t.notes.sessionTimeoutHours, {
                hours: data.security.sessionTimeoutHours,
              }),
              hint: t.notes.sessionTimeout,
            },
            {
              label: t.meta.mfaStatus,
              value: data.security.mfaRequired
                ? t.notes.mfaRequired
                : t.notes.mfaOptional,
            },
            {
              label: t.meta.rateLimiting,
              value: fillTemplate(t.notes.rateLimiting, {
                max: data.security.rateLimitingMaxPerMin,
              }),
              tone: data.security.rateLimitingTone,
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        title={t.systemSettings}
        description={t.systemSettingsDesc}
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
          {fillTemplate(t.honestGaps, {
            items: data.unavailable.join(", "),
          })}
        </p>
      ) : null}
    </div>
  );
}
