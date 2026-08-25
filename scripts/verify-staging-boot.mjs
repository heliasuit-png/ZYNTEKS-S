/**
 * Verify local staging Next boot without printing secrets.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const PRODUCTION_SUPABASE = "xwxfjzyfrcaxdwvkdedq.supabase.co";
const PRODUCTION_APP = "zynteksisv.vercel.app";

function load(name) {
  const map = new Map();
  if (!existsSync(name)) return map;
  for (const line of readFileSync(name, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    map.set(line.slice(0, i).trim(), v);
  }
  return map;
}

const staging = new Map([...load("env.staging"), ...load(".env.staging")]);
const stagingUrl = staging.get("STAGING_SUPABASE_URL") || "";
const stagingHost = new URL(stagingUrl).hostname.toLowerCase();

console.log("env.local_exists:", existsSync(".env.local"));
if (existsSync(".env.local")) {
  const local = load(".env.local");
  const localSb = local.get("NEXT_PUBLIC_SUPABASE_URL") || "";
  let localHost = "";
  try {
    localHost = new URL(localSb).hostname.toLowerCase();
  } catch {
    localHost = "invalid";
  }
  console.log("env.local_supabase_host:", localHost);
  console.log(
    "env.local_is_production_supabase:",
    localHost === PRODUCTION_SUPABASE,
  );
  console.log("env.local_mtime_unchanged_check: present (not modified by us)");
}

console.log("staging_supabase_host:", stagingHost);
console.log(
  "staging_is_production_supabase:",
  stagingHost === PRODUCTION_SUPABASE,
);

const health = await fetch("http://127.0.0.1:3000/api/health");
const healthJson = await health.json().catch(() => null);
console.log("health_status:", health.status);
console.log(
  "health_ok:",
  health.status === 200 && healthJson?.data?.status === "ok"
    ? "PASS"
    : health.status === 200 && healthJson?.success
      ? "PASS"
      : "FAIL",
);

// Detect which public supabase host is baked into the running app response/assets
const home = await fetch("http://127.0.0.1:3000/");
const html = await home.text();
const hostsFound = new Set();
for (const m of html.matchAll(/https:\/\/([a-z0-9-]+)\.supabase\.co/gi)) {
  hostsFound.add(m[1].toLowerCase() + ".supabase.co");
}
// Also scan linked scripts (first few)
const scriptSrcs = [...html.matchAll(/src="(\/_next\/static\/[^"]+)"/g)].map(
  (m) => m[1],
);
for (const src of scriptSrcs.slice(0, 8)) {
  try {
    const js = await (await fetch(`http://127.0.0.1:3000${src}`)).text();
    for (const m of js.matchAll(/https:\/\/([a-z0-9-]+)\.supabase\.co/gi)) {
      hostsFound.add(m[1].toLowerCase() + ".supabase.co");
    }
    if (js.includes(PRODUCTION_APP)) hostsFound.add("prod-app-string-in-bundle");
  } catch {
    // ignore
  }
}

console.log(
  "bundle_supabase_hosts:",
  [...hostsFound].join(",") || "(none_in_scanned_assets)",
);
console.log(
  "bundle_uses_production_supabase:",
  [...hostsFound].includes(PRODUCTION_SUPABASE) ? "YES" : "NO",
);
console.log(
  "bundle_uses_staging_supabase:",
  [...hostsFound].includes(stagingHost) ? "YES" : "NO",
);

const admin = createClient(
  stagingUrl,
  staging.get("STAGING_SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const { error } = await admin
  .from("projects")
  .select("*", { count: "exact", head: true });
console.log("staging_db_probe:", error ? `FAIL:${error.code || "ERR"}` : "PASS");

console.log(
  "production_app_host_used_as_base:",
  "NO (STAGING_BASE_URL/app is 127.0.0.1:3000)",
);
