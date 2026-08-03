import "server-only";

import { MONITORING, PROJECT_FRAMEWORK_LABELS } from "@/lib/constants";
import { alreadyNotified, dispatchNotification } from "@/services/notifications";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { ProjectFramework } from "@/types/database";

/**
 * Scans recently changed entities and raises transactional notifications for
 * project creation, API key revocation and critical (fatal) errors. Runs on
 * the service-role client and is fully deduplicated so previous modules never
 * need to be modified to emit these events.
 */

type Supabase = TypedSupabaseClient;

export interface EventScanSummary {
  projectsCreated: number;
  apiKeysRevoked: number;
  criticalErrors: number;
}

async function getProjectNames(
  admin: Supabase,
  ids: string[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const unique = [...new Set(ids)];
  if (unique.length === 0) {
    return names;
  }
  const { data } = await admin
    .from("projects")
    .select("id, name")
    .in("id", unique);
  for (const row of data ?? []) {
    names.set(row.id, row.name);
  }
  return names;
}

export async function scanNotifiableEvents(
  admin: Supabase,
): Promise<EventScanSummary> {
  const sinceIso = new Date(
    Date.now() - MONITORING.eventScanWindowMs,
  ).toISOString();

  const summary: EventScanSummary = {
    projectsCreated: 0,
    apiKeysRevoked: 0,
    criticalErrors: 0,
  };

  // Project created ---------------------------------------------------------
  const { data: newProjects } = await admin
    .from("projects")
    .select("id, user_id, name, framework, created_at")
    .gte("created_at", sinceIso);

  for (const project of newProjects ?? []) {
    const seen = await alreadyNotified(admin, {
      userId: project.user_id,
      type: "project_created",
      dedupeKey: "projectCreatedId",
      dedupeValue: project.id,
    });
    if (seen) {
      continue;
    }
    await dispatchNotification(admin, {
      userId: project.user_id,
      projectId: project.id,
      type: "project_created",
      projectName: project.name,
      framework:
        PROJECT_FRAMEWORK_LABELS[project.framework as ProjectFramework] ?? null,
      createdAt: project.created_at,
    });
    summary.projectsCreated += 1;
  }

  // API key revoked ---------------------------------------------------------
  const { data: revokedKeys } = await admin
    .from("api_keys")
    .select("id, user_id, project_id, name, key_prefix, revoked_at")
    .eq("status", "revoked")
    .gte("revoked_at", sinceIso);

  const revokedProjectNames = await getProjectNames(
    admin,
    (revokedKeys ?? []).map((key) => key.project_id),
  );

  for (const key of revokedKeys ?? []) {
    const seen = await alreadyNotified(admin, {
      userId: key.user_id,
      type: "api_key_revoked",
      dedupeKey: "keyId",
      dedupeValue: key.id,
    });
    if (seen) {
      continue;
    }
    await dispatchNotification(admin, {
      userId: key.user_id,
      projectId: key.project_id,
      type: "api_key_revoked",
      projectName: revokedProjectNames.get(key.project_id) ?? "Project",
      keyId: key.id,
      keyName: key.name,
      keyPrefix: key.key_prefix,
      revokedAt: key.revoked_at ?? new Date().toISOString(),
    });
    summary.apiKeysRevoked += 1;
  }

  // Critical (fatal) errors -------------------------------------------------
  const { data: fatalErrors } = await admin
    .from("errors")
    .select("id, user_id, project_id, message, url, last_seen")
    .eq("level", "fatal")
    .gte("last_seen", sinceIso);

  const errorProjectNames = await getProjectNames(
    admin,
    (fatalErrors ?? []).map((error) => error.project_id),
  );

  for (const error of fatalErrors ?? []) {
    const seen = await alreadyNotified(admin, {
      userId: error.user_id,
      type: "critical_error",
      dedupeKey: "errorId",
      dedupeValue: error.id,
    });
    if (seen) {
      continue;
    }
    await dispatchNotification(admin, {
      userId: error.user_id,
      projectId: error.project_id,
      type: "critical_error",
      projectName: errorProjectNames.get(error.project_id) ?? "Project",
      errorId: error.id,
      message: error.message,
      occurredAt: error.last_seen,
      url: error.url,
    });
    summary.criticalErrors += 1;
  }

  return summary;
}
