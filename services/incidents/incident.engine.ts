import "server-only";

import { MONITORING } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { formatDuration } from "@/utils/format";
import { dispatchNotification } from "@/services/notifications";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { IncidentSeverity } from "@/types/database";
import type { Incident } from "./types";

/**
 * Incident engine. Owns the automated lifecycle of monitor-generated
 * incidents. Runs with the service-role client (bypasses RLS) from the cron
 * pipeline.
 */

type Supabase = TypedSupabaseClient;

const UNIQUE_VIOLATION = "23505";
const HOUR_MS = 60 * 60 * 1000;

export interface OpenOutageInput {
  projectId: string;
  userId: string;
  projectName: string;
  lastHeartbeatAt: string | null;
}

/** Derives outage severity from heartbeat gap + recent fatal/error volume. */
async function calculateOutageSeverity(
  admin: Supabase,
  projectId: string,
  lastHeartbeatAt: string | null,
): Promise<IncidentSeverity> {
  const now = Date.now();
  const gapMs = lastHeartbeatAt
    ? Math.max(0, now - new Date(lastHeartbeatAt).getTime())
    : MONITORING.heartbeatTimeoutMs;

  const { count } = await admin
    .from("errors")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .in("level", ["fatal", "error"])
    .gte("last_seen", new Date(now - HOUR_MS).toISOString());

  const recentErrors = count ?? 0;
  if (gapMs >= HOUR_MS || recentErrors >= 10) return "critical";
  if (gapMs >= 40 * 60 * 1000 || recentErrors >= 5) return "high";
  if (recentErrors >= 1) return "medium";
  return "high";
}

/** Returns every open, monitor-generated incident. */
export async function getOpenMonitorIncidents(
  admin: Supabase,
): Promise<Incident[]> {
  const { data, error } = await admin
    .from("incidents")
    .select("*")
    .eq("source", "monitor")
    .neq("status", "resolved");
  if (error) {
    throw error;
  }
  return data ?? [];
}

/**
 * Opens an outage incident for a project. Idempotent: the partial unique index
 * guarantees at most one open monitor incident per project, so a concurrent
 * insert is treated as a no-op.
 */
export async function openOutageIncident(
  admin: Supabase,
  input: OpenOutageInput,
): Promise<Incident | null> {
  const timeoutMinutes = Math.round(MONITORING.heartbeatTimeoutMs / 60000);
  const startedAt = input.lastHeartbeatAt ?? new Date().toISOString();
  const severity = await calculateOutageSeverity(
    admin,
    input.projectId,
    input.lastHeartbeatAt,
  );

  const { data: incident, error } = await admin
    .from("incidents")
    .insert({
      project_id: input.projectId,
      user_id: input.userId,
      title: `${input.projectName} is not responding`,
      description: `No heartbeat received for more than ${timeoutMinutes} minutes.`,
      status: "investigating",
      severity,
      source: "monitor",
      started_at: startedAt,
      detected_at: new Date().toISOString(),
      last_heartbeat_at: input.lastHeartbeatAt,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return null;
    }
    throw error;
  }

  await admin.from("incident_updates").insert({
    incident_id: incident.id,
    user_id: input.userId,
    status: "investigating",
    message: `Automated monitor detected a possible outage: no heartbeat received for more than ${timeoutMinutes} minutes.`,
  });

  await dispatchNotification(admin, {
    userId: input.userId,
    projectId: input.projectId,
    type: "incident_created",
    projectName: input.projectName,
    incidentId: incident.id,
    incidentTitle: incident.title,
    severity: incident.severity,
    startedAt: incident.started_at,
  });

  logger.info("Opened outage incident", {
    incidentId: incident.id,
    projectId: input.projectId,
  });

  return incident;
}

export interface ResolveOutageInput {
  projectName: string;
  heartbeatAt: string | null;
}

/** Auto-resolves a monitor incident once heartbeats resume. */
export async function resolveOutageIncident(
  admin: Supabase,
  incident: Incident,
  input: ResolveOutageInput,
): Promise<void> {
  const resolvedAt = new Date();
  const downtimeSeconds = Math.max(
    0,
    Math.floor(
      (resolvedAt.getTime() - new Date(incident.started_at).getTime()) / 1000,
    ),
  );

  const { error } = await admin
    .from("incidents")
    .update({
      status: "resolved",
      resolved_at: resolvedAt.toISOString(),
      downtime_seconds: downtimeSeconds,
      auto_resolved: true,
      last_heartbeat_at: input.heartbeatAt,
    })
    .eq("id", incident.id);

  if (error) {
    throw error;
  }

  await admin.from("incident_updates").insert({
    incident_id: incident.id,
    user_id: incident.user_id,
    status: "resolved",
    message: "Heartbeats resumed. Incident automatically resolved.",
  });

  await dispatchNotification(admin, {
    userId: incident.user_id,
    projectId: incident.project_id,
    type: "incident_resolved",
    projectName: input.projectName,
    incidentId: incident.id,
    incidentTitle: incident.title,
    durationText: formatDuration(downtimeSeconds),
    resolvedAt: resolvedAt.toISOString(),
  });

  logger.info("Auto-resolved outage incident", {
    incidentId: incident.id,
    downtimeSeconds,
  });
}
