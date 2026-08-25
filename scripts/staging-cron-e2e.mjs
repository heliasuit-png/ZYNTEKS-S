/**
 * Staging-only cron authorization + job smoke.
 * Never prints secrets. Never hits production hosts. Never runs production cron.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PRODUCTION_APP = "zynteksisv.vercel.app";
const PRODUCTION_SB = "xwxfjzyfrcaxdwvkdedq.supabase.co";

const results = {
  unauthorized_health: "BLOCKED",
  unauthorized_monitor: "BLOCKED",
  authorized_health: "BLOCKED",
  authorized_monitor: "BLOCKED",
  vercel_json_schedules: "BLOCKED",
};

function load(name) {
  if (!existsSync(name)) return;
  for (const line of readFileSync(name, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

load(".env.staging");
load("env.staging");

function set(k, v) {
  results[k] = v;
}

function fail(k, detail) {
  set(k, "FAIL");
  console.log(`FAIL_DETAIL ${k}: ${detail}`);
}

function pass(k) {
  set(k, "PASS");
}

const baseUrl = (process.env.STAGING_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/+$/,
  "",
);
const supabaseUrl = process.env.STAGING_SUPABASE_URL || "";
const cronSecret =
  process.env.STAGING_CRON_SECRET?.trim() ||
  process.env.CRON_SECRET?.trim() ||
  (existsSync(".staging-cron-secret.tmp")
    ? readFileSync(".staging-cron-secret.tmp", "utf8").trim()
    : "");

if (!supabaseUrl) {
  console.log("PRODUCTION SAFETY: FAIL (missing STAGING_SUPABASE_URL)");
  process.exit(2);
}

const sbHost = new URL(supabaseUrl).hostname.toLowerCase();
const baseHost = new URL(baseUrl).hostname.toLowerCase();
if (sbHost === PRODUCTION_SB || baseHost === PRODUCTION_APP) {
  console.log("PRODUCTION SAFETY: FAIL (production target)");
  process.exit(2);
}

console.log("STAGING_BASE_URL_HOST:", baseHost);
console.log("STAGING_SUPABASE_HOST:", sbHost);
console.log("CRON_SECRET:", cronSecret ? "SET" : "UNSET");

// vercel.json schedule check (no secrets)
{
  const raw = readFileSync(resolve(process.cwd(), "vercel.json"), "utf8");
  const json = JSON.parse(raw);
  const crons = Array.isArray(json.crons) ? json.crons : [];
  const health = crons.find((c) => c.path === "/api/cron/health");
  const monitor = crons.find((c) => c.path === "/api/cron/monitor");
  if (
    health?.schedule === "0 0 * * *" &&
    monitor?.schedule === "0 1 * * *" &&
    crons.length === 2
  ) {
    pass("vercel_json_schedules");
  } else {
    fail(
      "vercel_json_schedules",
      `unexpected crons=${JSON.stringify(crons).slice(0, 200)}`,
    );
  }
}

let appOk = false;
try {
  const health = await fetch(`${baseUrl}/api/health`);
  const body = await health.json().catch(() => ({}));
  const runtimeHost = body?.data?.supabaseHost || "";
  if (runtimeHost === PRODUCTION_SB) {
    console.log("APP: FAIL (runtime production supabase)");
    process.exit(2);
  }
  if (!health.ok) {
    console.log("APP: DOWN (health not ok)");
  } else if (runtimeHost && runtimeHost !== sbHost) {
    console.log("APP: FAIL (runtime host mismatch)");
    process.exit(2);
  } else {
    appOk = true;
    console.log("APP: PASS", runtimeHost || "(no host field)");
  }
} catch (e) {
  console.log(
    "APP: DOWN",
    e instanceof Error ? e.message.slice(0, 120) : "unknown",
  );
}

if (!appOk) {
  set("unauthorized_health", "BLOCKED");
  set("unauthorized_monitor", "BLOCKED");
  set("authorized_health", "BLOCKED");
  set("authorized_monitor", "BLOCKED");
} else {
  // Unauthorized
  for (const [key, path] of [
    ["unauthorized_health", "/api/cron/health"],
    ["unauthorized_monitor", "/api/cron/monitor"],
  ]) {
    const res = await fetch(`${baseUrl}${path}`);
    if (res.status === 401 || res.status === 403) pass(key);
    else fail(key, `expected 401/403 got ${res.status}`);
  }

  if (!cronSecret || cronSecret === "generate-a-long-random-secret") {
    set("authorized_health", "BLOCKED");
    set("authorized_monitor", "BLOCKED");
    console.log("AUTHORIZED: BLOCKED (CRON_SECRET unset or placeholder)");
  } else {
    for (const [key, path] of [
      ["authorized_health", "/api/cron/health"],
      ["authorized_monitor", "/api/cron/monitor"],
    ]) {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${cronSecret}` },
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 200 && json?.success === true && json?.data?.ok === true) {
        pass(key);
      } else {
        fail(
          key,
          `status=${res.status} success=${json?.success} ok=${json?.data?.ok}`,
        );
      }
    }
  }
}

console.log("\nPHASE B — CRON STAGING");
for (const [k, v] of Object.entries(results)) {
  console.log(`${k}: ${v}`);
}

const failed = Object.values(results).filter((v) => v === "FAIL").length;
if (failed > 0) process.exitCode = 1;
