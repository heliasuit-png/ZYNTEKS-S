/**
 * Start Next.js against HOSTED STAGING Supabase only.
 * Does not modify .env.local. Never prints secrets.
 * Process env overrides beat Next.js .env.local loading.
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const PRODUCTION_SUPABASE_HOST = "xwxfjzyfrcaxdwvkdedq.supabase.co";
const PRODUCTION_APP_HOSTS = new Set([
  "zynteksisv.vercel.app",
  "zynteks-s.vercel.app",
  "zynteksisv1.vercel.app",
]);

function loadFile(name) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return new Map();
  const map = new Map();
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
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

const staging = new Map([
  ...loadFile("env.staging"),
  ...loadFile(".env.staging"),
]);

function req(key) {
  const v = staging.get(key)?.trim();
  if (!v) {
    console.log(`MISSING: ${key}`);
    process.exit(1);
  }
  return v;
}

const stagingUrl = req("STAGING_SUPABASE_URL");
const stagingAnon = req("STAGING_SUPABASE_ANON_KEY");
const stagingService = req("STAGING_SUPABASE_SERVICE_ROLE_KEY");

let stagingHost = "";
try {
  stagingHost = new URL(stagingUrl).hostname.toLowerCase();
} catch {
  console.log("FAIL: invalid STAGING_SUPABASE_URL");
  process.exit(1);
}

if (stagingHost === PRODUCTION_SUPABASE_HOST) {
  console.log("BLOCKED: staging URL is production Supabase");
  process.exit(2);
}

const appUrl = "http://127.0.0.1:3000";
const openai =
  staging.get("STAGING_OPENAI_API_KEY")?.trim() ||
  staging.get("INTEGRATION_OPENAI_API_KEY")?.trim() ||
  "";

const childEnv = {
  ...process.env,
  NEXT_PUBLIC_APP_URL: appUrl,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "ZYNTEKSIS",
  NEXT_PUBLIC_SUPABASE_URL: stagingUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: stagingAnon,
  SUPABASE_SERVICE_ROLE_KEY: stagingService,
  VERCEL_URL: "",
  VERCEL_ENV: "development",
};

// Server-only cron auth for local staging. Prefer explicit staging key; else
// reuse CRON_SECRET from staging files; else generate ephemeral (never printed).
const stagingCron =
  staging.get("STAGING_CRON_SECRET")?.trim() ||
  staging.get("CRON_SECRET")?.trim() ||
  "";
const cronSecret =
  stagingCron && stagingCron !== "generate-a-long-random-secret"
    ? stagingCron
    : randomBytes(32).toString("hex");
childEnv.CRON_SECRET = cronSecret;
writeFileSync(
  resolve(process.cwd(), ".staging-cron-secret.tmp"),
  `${cronSecret}\n`,
  { encoding: "utf8", mode: 0o600 },
);

if (openai) {
  childEnv.OPENAI_API_KEY = openai;
}

for (const [k, v] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: childEnv.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_APP_URL: childEnv.NEXT_PUBLIC_APP_URL,
})) {
  try {
    const h = new URL(v).hostname.toLowerCase();
    if (h === PRODUCTION_SUPABASE_HOST || PRODUCTION_APP_HOSTS.has(h)) {
      console.log(`BLOCKED: ${k} resolves to production host`);
      process.exit(2);
    }
  } catch {
    console.log(`FAIL: invalid ${k}`);
    process.exit(1);
  }
}

const require = createRequire(import.meta.url);
const nextBin = resolve(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

if (!existsSync(nextBin)) {
  console.log("FAIL: next binary missing (run npm install)");
  process.exit(1);
}

console.log("MODE: local-staging");
console.log("APP_URL:", appUrl);
console.log("SUPABASE_HOST:", stagingHost);
console.log("OPENAI:", openai ? "SET_FROM_STAGING" : "UNSET_OPTIONAL");
console.log("CRON_SECRET:", stagingCron ? "SET_FROM_STAGING" : "GENERATED_EPHEMERAL");
console.log("OVERRIDE: process env forces staging over .env.local");
console.log("STARTING: node next dev -H 127.0.0.1 -p 3000");

const child = spawn(
  process.execPath,
  [nextBin, "dev", "-H", "127.0.0.1", "-p", "3000"],
  {
    cwd: process.cwd(),
    env: childEnv,
    stdio: "inherit",
  },
);

child.on("exit", (code) => process.exit(code ?? 1));
