import "server-only";

import { AI, MONITORING } from "@/lib/constants";
import { truncate } from "@/utils/format";
import type { TypedSupabaseClient } from "@/supabase/client";
import type { AiContext } from "@/services/ai/types";

type Supabase = TypedSupabaseClient;

function line(label: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return `${label}: unknown`;
  }
  return `${label}: ${value}`;
}

function avg(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function scoreMetric(value: number | null, good: number, ok: number): number | null {
  if (value === null) return null;
  if (value <= good) return 100;
  if (value <= ok) return 70;
  return 40;
}

/**
 * Builds a read-only context block describing a project's current health.
 * Includes stacks, related errors/incidents, performance samples, SDK events,
 * API key activity and derived health scores so RCA and review intents have
 * real evidence. Nothing here mutates any table.
 */
export async function buildProjectContext(
  supabase: Supabase,
  _userId: string,
  projectId: string | null,
): Promise<AiContext> {
  if (!projectId) {
    return {
      hasProject: false,
      text: "No project is attached to this conversation. Answer using general engineering knowledge and ask for specifics when needed.",
    };
  }

  // Access is enforced by RLS (owner or workspace member). Do not require
  // projects.user_id === caller — team members must still get full context.
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, framework, production_url, staging_url, status, workspace_id, user_id",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return {
      hasProject: false,
      text: "The referenced project could not be found. Answer generally.",
    };
  }

  const [
    errorsResult,
    incidentsResult,
    perfResult,
    heartbeatResult,
    eventsResult,
    apiKeysResult,
    apiLogsResult,
  ] = await Promise.all([
    supabase
      .from("errors")
      .select(
        "id, message, type, level, environment, release, occurrences, first_seen, last_seen, url, fingerprint, stack, browser, os",
      )
      .eq("project_id", projectId)
      .order("last_seen", { ascending: false })
      .limit(AI.context.maxErrors),
    supabase
      .from("incidents")
      .select(
        "id, title, description, status, severity, started_at, resolved_at, downtime_seconds, auto_resolved",
      )
      .eq("project_id", projectId)
      .order("started_at", { ascending: false })
      .limit(AI.context.maxIncidents),
    supabase
      .from("performance_logs")
      .select("url, page_load, fcp, lcp, cls, inp, ttfb, occurred_at, environment, release")
      .eq("project_id", projectId)
      .order("occurred_at", { ascending: false })
      .limit(AI.context.maxPerfSamples),
    supabase
      .from("heartbeats")
      .select("occurred_at, environment, release, page, uptime, memory")
      .eq("project_id", projectId)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("error_events")
      .select("type, name, level, message, url, environment, release, occurred_at")
      .eq("project_id", projectId)
      .order("occurred_at", { ascending: false })
      .limit(AI.context.maxErrorEvents),
    supabase
      .from("api_keys")
      .select("name, environment, status, last_used_at, created_at, key_prefix")
      .eq("project_id", projectId)
      .limit(20),
    supabase
      .from("api_key_logs")
      .select("event, ip_address, created_at, metadata")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(AI.context.maxApiKeyLogs),
  ]);

  const errors = errorsResult.data ?? [];
  const incidents = incidentsResult.data ?? [];
  const perfSamples = perfResult.data ?? [];
  const events = eventsResult.data ?? [];
  const apiKeys = apiKeysResult.data ?? [];
  const apiLogs = apiLogsResult.data ?? [];
  const heartbeat = heartbeatResult.data;

  const sections: string[] = [];

  sections.push(
    [
      "## Project",
      line("Name", project.name),
      line("Framework", project.framework),
      line("Status", project.status),
      line("Production URL", project.production_url),
      line("Staging URL", project.staging_url),
      line("Uses HTTPS in production", project.production_url?.startsWith("https://") ? "yes" : project.production_url ? "no" : "unknown"),
    ].join("\n"),
  );

  let heartbeatState = "no heartbeats received yet";
  let heartbeatAgeMinutes: number | null = null;
  if (heartbeat?.occurred_at) {
    const ageMs = Date.now() - new Date(heartbeat.occurred_at).getTime();
    heartbeatAgeMinutes = Math.round(ageMs / 60000);
    const stale = ageMs > MONITORING.heartbeatTimeoutMs;
    heartbeatState = `last seen ${new Date(heartbeat.occurred_at).toISOString()} (${stale ? "STALE — possible outage" : "healthy"}, ~${heartbeatAgeMinutes}m ago)`;
  }
  sections.push(
    [
      "## Live status",
      line("Heartbeat", heartbeatState),
      line("Environment", heartbeat?.environment),
      line("Release", heartbeat?.release),
      line("Current page", heartbeat?.page),
      line("Uptime (s)", heartbeat?.uptime),
      line("Memory sample", heartbeat?.memory ? JSON.stringify(heartbeat.memory) : null),
    ].join("\n"),
  );

  // --- Errors with stacks + related grouping ------------------------------
  if (errors.length > 0) {
    const rows = errors.map((e, index) => {
      const stack = e.stack
        ? truncate(e.stack.replace(/\r\n/g, "\n"), AI.context.maxStackChars)
        : null;
      const relatedIncidents = incidents
        .filter((i) => {
          const started = new Date(i.started_at).getTime();
          const last = new Date(e.last_seen).getTime();
          return Math.abs(started - last) <= 6 * 60 * 60 * 1000;
        })
        .slice(0, 2)
        .map((i) => `[${i.severity}/${i.status}] ${i.title}`)
        .join("; ");

      return [
        `### Error ${index + 1}`,
        line("Message", e.message),
        line("Type", e.type),
        line("Level", e.level),
        line("Occurrences", e.occurrences),
        line("Environment", e.environment),
        line("Release", e.release),
        line("URL", e.url),
        line("Fingerprint", e.fingerprint),
        line("First seen", e.first_seen),
        line("Last seen", e.last_seen),
        line("Browser", e.browser ? JSON.stringify(e.browser) : null),
        line("OS", e.os ? JSON.stringify(e.os) : null),
        line("Related incidents (time proximity)", relatedIncidents || "none"),
        stack ? `Stack:\n\`\`\`\n${stack}\n\`\`\`` : "Stack: not recorded",
      ].join("\n");
    });
    sections.push(`## Recent errors (top ${errors.length})\n\n${rows.join("\n\n")}`);
  } else {
    sections.push("## Recent errors\nNone recorded.");
  }

  // --- Incidents with related errors --------------------------------------
  if (incidents.length > 0) {
    const rows = incidents.map((i, index) => {
      const relatedErrors = errors
        .filter((e) => {
          const last = new Date(e.last_seen).getTime();
          const started = new Date(i.started_at).getTime();
          const ended = i.resolved_at
            ? new Date(i.resolved_at).getTime()
            : Date.now();
          return last >= started - 60 * 60 * 1000 && last <= ended + 60 * 60 * 1000;
        })
        .slice(0, 3)
        .map((e) => truncate(e.message, 80))
        .join("; ");

      return [
        `### Incident ${index + 1}`,
        line("Title", i.title),
        line("Severity", i.severity),
        line("Status", i.status),
        line("Started", i.started_at),
        line("Resolved", i.resolved_at),
        line("Downtime (s)", i.downtime_seconds),
        line("Auto-resolved", i.auto_resolved ? "yes" : "no"),
        line("Description", i.description),
        line("Related errors in window", relatedErrors || "none"),
      ].join("\n");
    });
    sections.push(`## Incidents (recent ${incidents.length})\n\n${rows.join("\n\n")}`);
  } else {
    sections.push("## Incidents\nNone recorded.");
  }

  // --- Performance samples + derived score --------------------------------
  if (perfSamples.length > 0) {
    const avgLcp = avg(perfSamples.map((p) => p.lcp));
    const avgInp = avg(perfSamples.map((p) => p.inp));
    const avgCls = avg(perfSamples.map((p) => p.cls));
    const avgTtfb = avg(perfSamples.map((p) => p.ttfb));
    const avgFcp = avg(perfSamples.map((p) => p.fcp));
    const avgLoad = avg(perfSamples.map((p) => p.page_load));
    const scores = [
      scoreMetric(avgLcp, 2500, 4000),
      scoreMetric(avgInp, 200, 500),
      scoreMetric(avgCls, 0.1, 0.25),
      scoreMetric(avgTtfb, 800, 1800),
      scoreMetric(avgFcp, 1800, 3000),
    ].filter((v): v is number => v !== null);
    const performanceScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    const sampleRows = perfSamples
      .slice(0, 5)
      .map(
        (p, i) =>
          `- Sample ${i + 1}: load=${p.page_load ?? "n/a"}ms fcp=${p.fcp ?? "n/a"} lcp=${p.lcp ?? "n/a"} cls=${p.cls ?? "n/a"} inp=${p.inp ?? "n/a"} ttfb=${p.ttfb ?? "n/a"} url=${p.url ?? "n/a"} at ${p.occurred_at}`,
      )
      .join("\n");

    sections.push(
      [
        "## Performance",
        line("Samples", perfSamples.length),
        line("Avg page load (ms)", avgLoad),
        line("Avg FCP (ms)", avgFcp),
        line("Avg LCP (ms)", avgLcp),
        line("Avg CLS", avgCls),
        line("Avg INP (ms)", avgInp),
        line("Avg TTFB (ms)", avgTtfb),
        line("Derived performance score", performanceScore),
        "Recent samples:",
        sampleRows,
      ].join("\n"),
    );
  } else {
    sections.push("## Performance\nNo performance samples recorded.");
  }

  // --- SDK / log events ---------------------------------------------------
  if (events.length > 0) {
    const rows = events
      .map(
        (e) =>
          `- [${e.level}] ${e.type}${e.name ? `/${e.name}` : ""}: ${truncate(e.message ?? "", 100)} (env: ${e.environment}, release: ${e.release ?? "n/a"}, at: ${e.occurred_at})`,
      )
      .join("\n");
    sections.push(`## Recent SDK / log events (top ${events.length})\n${rows}`);
  } else {
    sections.push("## Recent SDK / log events\nNone recorded.");
  }

  // --- API keys + auth/usage logs (security + API review) -----------------
  if (apiKeys.length > 0) {
    const keyRows = apiKeys
      .map(
        (k) =>
          `- ${k.name} [${k.environment}/${k.status}] prefix=${k.key_prefix} created=${k.created_at} last_used=${k.last_used_at ?? "never"}`,
      )
      .join("\n");
    sections.push(`## API keys\n${keyRows}`);
  } else {
    sections.push("## API keys\nNone recorded.");
  }

  if (apiLogs.length > 0) {
    const logRows = apiLogs
      .map(
        (l) =>
          `- ${l.event} at ${l.created_at}${l.ip_address ? ` ip=${l.ip_address}` : ""}`,
      )
      .join("\n");
    const authFailed = apiLogs.filter((l) => l.event === "auth_failed").length;
    const authSuccess = apiLogs.filter((l) => l.event === "auth_success").length;
    sections.push(
      [
        "## Recent API key activity",
        line("Auth success (sample)", authSuccess),
        line("Auth failed (sample)", authFailed),
        logRows,
      ].join("\n"),
    );
  } else {
    sections.push("## Recent API key activity\nNone recorded.");
  }

  // --- Derived project health scores (deterministic, evidence-based) ------
  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const fatalOrError = errors.filter(
    (e) => e.level === "fatal" || e.level === "error",
  );
  const curOcc = errors.reduce((acc, e) => acc + (e.occurrences ?? 0), 0);
  const heartbeatStale =
    heartbeat?.occurred_at != null &&
    Date.now() - new Date(heartbeat.occurred_at).getTime() >
      MONITORING.heartbeatTimeoutMs;

  let reliability = 100;
  reliability -= Math.min(
    60,
    openIncidents.reduce((acc, i) => {
      const w =
        i.severity === "critical"
          ? 25
          : i.severity === "high"
            ? 15
            : i.severity === "medium"
              ? 8
              : 4;
      return acc + w;
    }, 0),
  );
  reliability -= Math.min(30, Math.floor(curOcc / 5));
  reliability -= Math.min(20, fatalOrError.length * 4);
  reliability = Math.max(0, Math.min(100, Math.round(reliability)));

  let availability = 100;
  if (heartbeatStale) availability = Math.min(availability, 70);
  if (!heartbeat && errors.length === 0 && incidents.length === 0) {
    availability = 100;
  }
  availability = Math.max(0, Math.min(100, Math.round(availability)));

  let security = 96;
  const authFailLogs = apiLogs.filter((l) => l.event === "auth_failed").length;
  if (authFailLogs > 0) security -= Math.min(20, authFailLogs * 4);
  if (
    project.production_url &&
    !project.production_url.startsWith("https://")
  ) {
    security -= 10;
  }
  const oldKeys = apiKeys.filter((k) => {
    if (k.status !== "active") return false;
    return Date.now() - new Date(k.created_at).getTime() > 90 * 24 * 60 * 60 * 1000;
  });
  if (oldKeys.length > 0) security -= 6;
  const unusedActive = apiKeys.filter(
    (k) => k.status === "active" && !k.last_used_at,
  );
  if (unusedActive.length > 0) security -= 4;
  security = Math.max(0, Math.min(100, Math.round(security)));

  const perfScores = perfSamples.length
    ? [
        scoreMetric(avg(perfSamples.map((p) => p.lcp)), 2500, 4000),
        scoreMetric(avg(perfSamples.map((p) => p.inp)), 200, 500),
        scoreMetric(avg(perfSamples.map((p) => p.cls)), 0.1, 0.25),
        scoreMetric(avg(perfSamples.map((p) => p.ttfb)), 800, 1800),
      ].filter((v): v is number => v !== null)
    : [];
  const performance =
    perfScores.length > 0
      ? Math.round(perfScores.reduce((a, b) => a + b, 0) / perfScores.length)
      : 85;

  const distinctSignatures = new Set(
    errors.map((e) => `${e.type ?? ""}:${e.message}`),
  ).size;
  let maintainability = 92;
  maintainability -= Math.min(30, distinctSignatures * 2);
  maintainability -= Math.min(
    18,
    errors.filter((e) => e.occurrences > 50).length * 6,
  );
  maintainability = Math.max(0, Math.min(100, Math.round(maintainability)));

  const overall = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        reliability * 0.28 +
          availability * 0.28 +
          performance * 0.18 +
          security * 0.13 +
          maintainability * 0.13,
      ),
    ),
  );

  sections.push(
    [
      "## Project health scores (derived from telemetry)",
      line("Overall", overall),
      line("Reliability", reliability),
      line("Availability", availability),
      line("Performance", performance),
      line("Security", security),
      line("Maintainability", maintainability),
      line("Open incidents", openIncidents.length),
      line("Error occurrences (sampled groups)", curOcc),
      line("Heartbeat stale", heartbeatStale ? "yes" : "no"),
      "Use these scores for Project Health, Performance, Security and Architecture reviews. Cite the underlying evidence sections above — do not invent metrics.",
    ].join("\n"),
  );

  // Architecture hints from framework + observed surface area
  sections.push(
    [
      "## Architecture signals",
      line("Framework", project.framework),
      line("Distinct error signatures (sample)", distinctSignatures),
      line("Environments seen in errors", [
        ...new Set(errors.map((e) => e.environment)),
      ].join(", ") || "none"),
      line("Releases seen in errors", [
        ...new Set(errors.map((e) => e.release).filter(Boolean)),
      ].join(", ") || "none"),
      "Frame architecture advice around the framework above and the failure surfaces in errors/incidents. Do not invent folder trees that are not in evidence.",
    ].join("\n"),
  );

  return { hasProject: true, text: sections.join("\n\n") };
}
