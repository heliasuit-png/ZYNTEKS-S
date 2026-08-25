/**
 * Normalize env.staging → .env.staging and report presence only.
 * Never prints secret values. Refuses production Supabase host.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const PRODUCTION_HOST = "xwxfjzyfrcaxdwvkdedq.supabase.co";
const PRODUCTION_REF = "xwxfjzyfrcaxdwvkdedq";

const src = existsSync("env.staging")
  ? "env.staging"
  : existsSync(".env.staging")
    ? ".env.staging"
    : null;

if (!src) {
  console.log("FAIL: env.staging / .env.staging missing");
  process.exit(1);
}

const map = new Map();
for (const line of readFileSync(src, "utf8").split(/\r?\n/)) {
  if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  map.set(line.slice(0, i).trim(), line.slice(i + 1).trim());
}

function strip(v) {
  if (!v) return "";
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

const url = strip(map.get("STAGING_SUPABASE_URL") || "");
let host = "";
try {
  host = new URL(url).hostname.toLowerCase();
} catch {
  console.log("URL_CHECK: FAIL");
  process.exit(1);
}

if (host === PRODUCTION_HOST) {
  console.log("URL_CHECK: BLOCKED production");
  process.exit(2);
}

const ref = host.split(".")[0] || "";
if (ref === PRODUCTION_REF) {
  console.log("REF_CHECK: BLOCKED production");
  process.exit(2);
}

writeFileSync(".staging-project-ref.tmp", ref);

const lines = [
  "# Normalized for harness — do not commit",
  "INTEGRATION_TARGET=staging",
  `STAGING_BASE_URL=${strip(map.get("STAGING_BASE_URL") || "http://127.0.0.1:3000")}`,
  `STAGING_SUPABASE_URL=${map.get("STAGING_SUPABASE_URL")}`,
  `STAGING_SUPABASE_ANON_KEY=${map.get("STAGING_SUPABASE_ANON_KEY")}`,
  `STAGING_SUPABASE_SERVICE_ROLE_KEY=${map.get("STAGING_SUPABASE_SERVICE_ROLE_KEY")}`,
];

for (const k of [
  "STAGING_DB_PASSWORD",
  "SUPABASE_DB_PASSWORD",
  "DATABASE_URL",
]) {
  if (map.get(k)) lines.push(`${k}=${map.get(k)}`);
}

writeFileSync(".env.staging", `${lines.join("\n")}\n`);

console.log("SOURCE:", src);
console.log("WROTE: .env.staging");
console.log("URL_CHECK: PASS");
console.log("REF_CHECK: PASS");
console.log("REF_LEN:", ref.length);
console.log(
  "HAS_DB_PASSWORD:",
  Boolean(
    map.get("STAGING_DB_PASSWORD") ||
      map.get("SUPABASE_DB_PASSWORD") ||
      map.get("DATABASE_URL"),
  ),
);
