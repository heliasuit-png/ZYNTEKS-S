/**
 * Staging-only integration env loader.
 * Never loads .env.local. Never falls back to production.
 * Docker / local Supabase are not required and not used.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  assertNotProductionTarget,
  hostnameOf,
  isProductionAppUrl,
  isProductionSupabaseUrl,
} from "./guard";

export type IntegrationMode = "ready" | "blocked";

export interface IntegrationEnv {
  mode: IntegrationMode;
  blocker: string | null;
  target: string | null;
  baseUrl: string | null;
  supabaseUrl: string | null;
  anonKeySet: boolean;
  serviceRoleSet: boolean;
  openaiSet: boolean;
  presence: Record<string, "SET" | "UNSET">;
}

function loadOptionalEnvFile(name: string): void {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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
    // Never override already-set process env; never load .env.local here.
    if (!(k in process.env)) process.env[k] = v;
  }
}

function pick(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  return undefined;
}

function presenceOf(...keys: string[]): "SET" | "UNSET" {
  return pick(...keys) ? "SET" : "UNSET";
}

/**
 * Mutation integration is ready only when:
 * - INTEGRATION_TARGET=staging
 * - STAGING_SUPABASE_URL is set (non-production)
 * - STAGING_SUPABASE_ANON_KEY is set
 * - STAGING_SUPABASE_SERVICE_ROLE_KEY is set
 * - STAGING_BASE_URL is set (non-production app under test)
 */
export function discoverIntegrationEnv(): IntegrationEnv {
  // Staging files only — never auto-load .env.local (production).
  loadOptionalEnvFile(".env.staging");
  loadOptionalEnvFile("env.staging");
  loadOptionalEnvFile(".env.integration");

  const target = (pick("INTEGRATION_TARGET") ?? "").toLowerCase();
  const baseUrl = pick("STAGING_BASE_URL", "INTEGRATION_BASE_URL") ?? null;
  const supabaseUrl = pick("STAGING_SUPABASE_URL") ?? null;
  const anonKey = pick("STAGING_SUPABASE_ANON_KEY");
  const serviceRole = pick("STAGING_SUPABASE_SERVICE_ROLE_KEY");
  const openai = pick("STAGING_OPENAI_API_KEY", "INTEGRATION_OPENAI_API_KEY");

  const presence: Record<string, "SET" | "UNSET"> = {
    INTEGRATION_TARGET: target ? "SET" : "UNSET",
    STAGING_BASE_URL: presenceOf("STAGING_BASE_URL"),
    STAGING_SUPABASE_URL: presenceOf("STAGING_SUPABASE_URL"),
    STAGING_SUPABASE_ANON_KEY: presenceOf("STAGING_SUPABASE_ANON_KEY"),
    STAGING_SUPABASE_SERVICE_ROLE_KEY: presenceOf(
      "STAGING_SUPABASE_SERVICE_ROLE_KEY",
    ),
    INTEGRATION_BASE_URL: presenceOf("INTEGRATION_BASE_URL"),
  };

  const blocked = (
    blocker: string,
    extras?: Partial<IntegrationEnv>,
  ): IntegrationEnv => ({
    mode: "blocked",
    blocker,
    target: target || null,
    baseUrl: baseUrl ? hostnameOf(baseUrl) : null,
    supabaseUrl: supabaseUrl ? hostnameOf(supabaseUrl) : null,
    anonKeySet: Boolean(anonKey),
    serviceRoleSet: Boolean(serviceRole),
    openaiSet: Boolean(openai),
    presence,
    ...extras,
  });

  if (target !== "staging") {
    return blocked(
      "STAGING SUPABASE REQUIRED — set INTEGRATION_TARGET=staging (Docker/local Supabase are not used).",
    );
  }

  if (!supabaseUrl || !anonKey || !serviceRole) {
    return blocked(
      "STAGING SUPABASE REQUIRED — set STAGING_SUPABASE_URL, STAGING_SUPABASE_ANON_KEY, and STAGING_SUPABASE_SERVICE_ROLE_KEY. Do not use production credentials.",
    );
  }

  if (!baseUrl) {
    return blocked(
      "STAGING SUPABASE REQUIRED — set STAGING_BASE_URL to a non-production app that uses the staging Supabase project.",
    );
  }

  if (isProductionAppUrl(baseUrl) || isProductionSupabaseUrl(supabaseUrl)) {
    return blocked(
      "BLOCKED: Integration tests cannot mutate Zynteksis production",
      {
        baseUrl: hostnameOf(baseUrl),
        supabaseUrl: hostnameOf(supabaseUrl),
      },
    );
  }

  try {
    assertNotProductionTarget({ baseUrl, supabaseUrl });
  } catch (e) {
    return blocked(e instanceof Error ? e.message : "production guard", {
      baseUrl: hostnameOf(baseUrl),
      supabaseUrl: hostnameOf(supabaseUrl),
    });
  }

  return {
    mode: "ready",
    blocker: null,
    target: "staging",
    baseUrl,
    supabaseUrl,
    anonKeySet: true,
    serviceRoleSet: true,
    openaiSet: Boolean(openai),
    presence,
  };
}

export function requireReadyIntegrationEnv(): IntegrationEnv & {
  mode: "ready";
  target: "staging";
  baseUrl: string;
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
} {
  const discovered = discoverIntegrationEnv();
  if (discovered.mode !== "ready") {
    throw new Error(discovered.blocker ?? "Integration env blocked");
  }
  const anonKey = pick("STAGING_SUPABASE_ANON_KEY")!;
  const serviceRoleKey = pick("STAGING_SUPABASE_SERVICE_ROLE_KEY")!;
  return {
    ...discovered,
    mode: "ready",
    target: "staging",
    baseUrl: discovered.baseUrl!,
    supabaseUrl: discovered.supabaseUrl!,
    anonKey,
    serviceRoleKey,
  };
}
