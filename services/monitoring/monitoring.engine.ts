import "server-only";

import { MONITORING } from "@/lib/constants";
import { logger } from "@/lib/logger";
import {
  getOpenMonitorIncidents,
  openOutageIncident,
  resolveOutageIncident,
} from "@/services/incidents";
import type { TypedSupabaseClient } from "@/supabase/client";

/**
 * Monitoring engine. Detects outages from heartbeat gaps and auto-resolves
 * incidents once heartbeats resume. Runs with the service-role client from the
 * cron pipeline (bypasses RLS).
 */

type Supabase = TypedSupabaseClient;

export interface MonitoringSummary {
  activeProjects: number;
  aliveProjects: number;
  incidentsOpened: number;
  incidentsResolved: number;
}

async function getLatestHeartbeatAt(
  admin: Supabase,
  projectId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("heartbeats")
    .select("occurred_at")
    .eq("project_id", projectId)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.occurred_at ?? null;
}

export async function runMonitoringPass(
  admin: Supabase,
): Promise<MonitoringSummary> {
  const nowIso = new Date().toISOString();
  const aliveThreshold = new Date(
    Date.now() - MONITORING.aliveWindowMs,
  ).toISOString();

  const { data: activeProjects, error } = await admin
    .from("projects")
    .select("id, user_id, name")
    .eq("status", "active");

  if (error) {
    throw error;
  }

  const activeMap = new Map(
    (activeProjects ?? []).map((project) => [project.id, project]),
  );
  const activeIds = [...activeMap.keys()];

  // Projects that have sent a heartbeat within the alive window.
  const aliveSet = new Set<string>();
  if (activeIds.length > 0) {
    const { data: recent } = await admin
      .from("heartbeats")
      .select("project_id")
      .in("project_id", activeIds)
      .gte("occurred_at", aliveThreshold);
    for (const row of recent ?? []) {
      aliveSet.add(row.project_id);
    }
  }

  const openIncidents = await getOpenMonitorIncidents(admin);
  const openByProject = new Map(
    openIncidents.map((incident) => [incident.project_id, incident]),
  );

  // Names/status for incident projects that are no longer active.
  const incidentProjectIds = openIncidents
    .map((incident) => incident.project_id)
    .filter((id) => !activeMap.has(id));
  const inactiveNames = new Map<string, string>();
  if (incidentProjectIds.length > 0) {
    const { data: rows } = await admin
      .from("projects")
      .select("id, name")
      .in("id", incidentProjectIds);
    for (const row of rows ?? []) {
      inactiveNames.set(row.id, row.name);
    }
  }

  let incidentsResolved = 0;
  for (const incident of openIncidents) {
    const isAlive = aliveSet.has(incident.project_id);
    const stillActive = activeMap.has(incident.project_id);
    if (!isAlive && stillActive) {
      continue;
    }
    const projectName =
      activeMap.get(incident.project_id)?.name ??
      inactiveNames.get(incident.project_id) ??
      "Project";
    await resolveOutageIncident(admin, incident, {
      projectName,
      heartbeatAt: isAlive ? nowIso : incident.last_heartbeat_at,
    });
    incidentsResolved += 1;
  }

  let incidentsOpened = 0;
  for (const projectId of activeIds) {
    if (aliveSet.has(projectId) || openByProject.has(projectId)) {
      continue;
    }
    const lastHeartbeatAt = await getLatestHeartbeatAt(admin, projectId);
    if (!lastHeartbeatAt) {
      // Project never reported a heartbeat; nothing to consider "down".
      continue;
    }
    const project = activeMap.get(projectId);
    if (!project) {
      continue;
    }
    const created = await openOutageIncident(admin, {
      projectId,
      userId: project.user_id,
      projectName: project.name,
      lastHeartbeatAt,
    });
    if (created) {
      incidentsOpened += 1;
    }
  }

  const summary: MonitoringSummary = {
    activeProjects: activeIds.length,
    aliveProjects: aliveSet.size,
    incidentsOpened,
    incidentsResolved,
  };
  logger.info("Monitoring pass complete", { ...summary });
  return summary;
}
