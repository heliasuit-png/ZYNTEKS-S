/**
 * Start Next.js against STAGING Supabase using .env.staging.
 * Does not modify .env.local or production. Never prints secret values.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import net from "node:net";

const PRODUCTION_SB = "xwxfjzyfrcaxdwvkdedq.supabase.co";
const PRODUCTION_APP = "zynteksisv.vercel.app";

function loadEnvFile(name, into) {
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
    into[k] = v;
  }
}

function waitPort(port, host = "127.0.0.1", ms = 180_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const probe = () => {
      const s = net.createConnection({ port, host }, () => {
        s.end();
        resolve(true);
      });
      s.on("error", () => {
        if (Date.now() - start > ms) {
          reject(new Error("timeout waiting for port"));
        } else {
          setTimeout(probe, 800);
        }
      });
    };
    probe();
  });
}

const fileEnv = {};
loadEnvFile(".env.staging", fileEnv);
loadEnvFile("env.staging", fileEnv);

const stagingUrl = fileEnv.STAGING_SUPABASE_URL || "";
const stagingAnon = fileEnv.STAGING_SUPABASE_ANON_KEY || "";
const stagingService = fileEnv.STAGING_SUPABASE_SERVICE_ROLE_KEY || "";
const baseUrl = (fileEnv.STAGING_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/+$/,
  "",
);

if (!stagingUrl || !stagingAnon || !stagingService) {
  console.error("STAGING_START: FAIL missing STAGING_* keys");
  process.exit(2);
}

let sbHost = "";
let appHost = "";
try {
  sbHost = new URL(stagingUrl).hostname.toLowerCase();
  appHost = new URL(baseUrl).hostname.toLowerCase();
} catch {
  console.error("STAGING_START: FAIL bad URL");
  process.exit(2);
}

if (sbHost === PRODUCTION_SB || appHost === PRODUCTION_APP) {
  console.error("STAGING_START: BLOCKED production target");
  process.exit(2);
}

const port = Number(new URL(baseUrl).port || 3000);
const host = new URL(baseUrl).hostname || "127.0.0.1";

const childEnv = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: stagingUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: stagingAnon,
  SUPABASE_SERVICE_ROLE_KEY: stagingService,
  NEXT_PUBLIC_APP_URL: baseUrl,
  STAGING_BASE_URL: baseUrl,
  STAGING_SUPABASE_URL: stagingUrl,
  STAGING_SUPABASE_ANON_KEY: stagingAnon,
  STAGING_SUPABASE_SERVICE_ROLE_KEY: stagingService,
  INTEGRATION_TARGET: "staging",
  PORT: String(port),
};

console.log(
  JSON.stringify(
    {
      step: "start_staging_app",
      host,
      port,
      supabaseHost: sbHost,
      appUrl: baseUrl,
    },
    null,
    2,
  ),
);

const nextBin = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextBin, "dev", "-H", host, "-p", String(port)], {
  cwd: process.cwd(),
  env: childEnv,
  stdio: ["ignore", "pipe", "pipe"],
  detached: false,
});

child.stdout.on("data", (buf) => {
  const text = buf.toString("utf8");
  if (/Ready in|Local:/i.test(text)) {
    console.log("STAGING_APP: READY_SIGNAL");
  }
});
child.stderr.on("data", (buf) => {
  const text = buf.toString("utf8");
  if (/EADDRINUSE/i.test(text)) {
    process.stderr.write("STAGING_START: EADDRINUSE\n");
  }
});

child.on("exit", (code) => {
  console.log("STAGING_APP_EXIT:", code);
  process.exit(code ?? 1);
});

try {
  await waitPort(port, host);
  console.log("STAGING_APP: PORT_OPEN");
} catch (e) {
  console.error("STAGING_START: FAIL", e instanceof Error ? e.message : e);
  child.kill();
  process.exit(1);
}

await new Promise(() => {});
