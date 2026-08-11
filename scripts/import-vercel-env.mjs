#!/usr/bin/env node
/**
 * Import `.env.production` into Vercel Production environment variables.
 *
 * Prerequisites:
 *   1. npm i -g vercel   (or use npx vercel)
 *   2. vercel login
 *   3. vercel link       (from repo root — creates .vercel/project.json)
 *
 * Usage (from repo root):
 *   node scripts/import-vercel-env.mjs
 *   node scripts/import-vercel-env.mjs --dry-run
 *   node scripts/import-vercel-env.mjs --env-file .env.production
 *   node scripts/import-vercel-env.mjs --skip-empty
 *
 * After import, redeploy Production with build cache DISABLED so
 * NEXT_PUBLIC_* values are baked into the client bundle.
 *
 * Does not modify application source code.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const skipEmpty = args.has("--skip-empty");

function argValue(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const envFile = resolve(ROOT, argValue("--env-file", ".env.production"));

/** Keys validated / used by the Next.js app (lib/env.ts). */
const APP_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "CRON_SECRET",
  "LOG_LEVEL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
];

const PRODUCTION_REQUIRED = new Set([
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "CRON_SECRET",
]);

function parseEnvFile(path) {
  const text = readFileSync(path, "utf8");
  const map = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

function resolveVercelBin() {
  const localCmd = resolve(
    ROOT,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "vercel.cmd" : "vercel",
  );
  if (existsSync(localCmd)) return { cmd: localCmd, via: "local" };

  const which = spawnSync(
    process.platform === "win32" ? "where.exe" : "which",
    ["vercel"],
    { encoding: "utf8" },
  );
  if (which.status === 0 && which.stdout.trim()) {
    return { cmd: "vercel", via: "path" };
  }

  return { cmd: "npx", via: "npx", npxArgs: ["--yes", "vercel@latest"] };
}

function runVercel(vercel, vercelArgs, { input } = {}) {
  const binArgs =
    vercel.via === "npx"
      ? [...vercel.npxArgs, ...vercelArgs]
      : vercelArgs;

  if (dryRun) {
    console.log(`[dry-run] ${vercel.cmd} ${binArgs.join(" ")}`);
    if (input != null) console.log(`[dry-run] stdin: <${input.length} chars>`);
    return { status: 0, stdout: "", stderr: "" };
  }

  const result = spawnSync(vercel.cmd, binArgs, {
    cwd: ROOT,
    encoding: "utf8",
    input: input != null ? `${input}\n` : undefined,
    shell: process.platform === "win32",
    stdio: input != null ? ["pipe", "pipe", "pipe"] : "pipe",
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function mask(value) {
  if (!value) return "(empty)";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}…${value.slice(-4)} (${value.length} chars)`;
}

function main() {
  console.log("ZYNTEKSIS → Vercel Production env import\n");

  if (!existsSync(envFile)) {
    console.error(`Missing env file: ${envFile}`);
    process.exit(1);
  }

  if (!existsSync(resolve(ROOT, ".vercel", "project.json"))) {
    console.error(
      "Project is not linked (.vercel/project.json missing).\n" +
        "Run from repo root:\n" +
        "  npx vercel login\n" +
        "  npx vercel link\n" +
        "Then re-run this script.",
    );
    process.exit(1);
  }

  const parsed = parseEnvFile(envFile);
  const vercel = resolveVercelBin();
  console.log(`Vercel CLI via: ${vercel.via}`);
  console.log(`Env file: ${envFile}`);
  console.log(`Mode: ${dryRun ? "dry-run" : "apply"}\n`);

  const missingRequired = [...PRODUCTION_REQUIRED].filter((k) => {
    const v = parsed.get(k);
    return v == null || v.trim() === "";
  });
  if (missingRequired.length) {
    console.error("Missing required production values:");
    for (const k of missingRequired) console.error(`  - ${k}`);
    process.exit(1);
  }

  const appUrl = parsed.get("NEXT_PUBLIC_APP_URL");
  if (appUrl?.includes("localhost")) {
    console.error(
      "Refusing to import: NEXT_PUBLIC_APP_URL still points at localhost.\n" +
        `  Got: ${appUrl}\n` +
        "  Expected: https://zynteksisv.vercel.app",
    );
    process.exit(1);
  }

  if (parsed.get("CRON_SECRET") === "generate-a-long-random-secret") {
    console.warn(
      "WARNING: CRON_SECRET is still the template placeholder. Rotate it for production.\n",
    );
  }

  // Snapshot current Production names (best-effort; never prints values).
  const listed = runVercel(vercel, ["env", "ls", "production"]);
  if (!dryRun && listed.status === 0) {
    console.log("Current Vercel Production env names:");
    console.log(listed.stdout.trim() || "(none listed)");
    console.log("");
  } else if (!dryRun && listed.status !== 0) {
    console.warn(
      "Could not list Production env (continuing with upsert):\n" +
        (listed.stderr || listed.stdout),
    );
  }

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const key of APP_KEYS) {
    if (!parsed.has(key)) {
      console.warn(`skip ${key} (not in env file)`);
      skipped += 1;
      continue;
    }
    const value = parsed.get(key) ?? "";
    if (skipEmpty && value === "") {
      console.log(`skip ${key} (empty)`);
      skipped += 1;
      continue;
    }

    console.log(`upsert ${key} = ${mask(value)}`);

    // Remove existing value so `env add` does not prompt / fail on conflict.
    runVercel(vercel, ["env", "rm", key, "production", "-y"]);

    const added = runVercel(vercel, ["env", "add", key, "production"], {
      input: value,
    });

    if (added.status === 0) {
      ok += 1;
    } else {
      failed += 1;
      console.error(
        `FAILED ${key}:\n${(added.stderr || added.stdout).trim()}`,
      );
    }
  }

  console.log("\n--- Summary ---");
  console.log(`upserted: ${ok}`);
  console.log(`skipped:  ${skipped}`);
  console.log(`failed:   ${failed}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Vercel → Deployments → Redeploy → uncheck "Use existing Build Cache"`);
  console.log(`  2. Verify: node scripts/check-live-app-url.mjs`);
  console.log(`     Expect: localhost=0, prod>0`);
  console.log(
    `  3. Supabase Auth → URL Configuration:\n` +
      `       Site URL: https://zynteksisv.vercel.app\n` +
      `       Redirect URLs: https://zynteksisv.vercel.app/auth/callback`,
  );

  process.exit(failed > 0 ? 1 : 0);
}

main();
