/**
 * Presence-only staging schema probe. Never prints secrets.
 * Uses limit(1) — head:true can false-positive when tables are missing.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const url = process.env.STAGING_SUPABASE_URL;
const key = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log("CREDS: MISSING");
  process.exit(1);
}

const host = new URL(url).hostname.toLowerCase();
if (host === "xwxfjzyfrcaxdwvkdedq.supabase.co") {
  console.log("BLOCKED: production");
  process.exit(2);
}
console.log("HOST_OK: yes");

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tables = [
  "profiles",
  "workspaces",
  "projects",
  "api_keys",
  "api_key_logs",
  "heartbeats",
  "errors",
  "error_events",
  "performance_logs",
  "ai_usage",
  "admin_users",
];

let ok = 0;
for (const t of tables) {
  const { error } = await admin.from(t).select("id").limit(1);
  if (error) {
    console.log(`TABLE ${t}: MISSING_OR_ERR (${error.code || "ERR"})`);
  } else {
    console.log(`TABLE ${t}: OK`);
    ok += 1;
  }
}
console.log(
  `SCHEMA_READY: ${ok === tables.length ? "YES" : "NO"} (${ok}/${tables.length})`,
);
if (ok !== tables.length) process.exit(1);
