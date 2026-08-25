/**
 * Disposable fixtures for hosted STAGING integration tests only.
 * Never logs plaintext API keys or passwords.
 * Never connects to production Supabase.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

import { API_KEY_PREFIX } from "@/lib/constants";
import type { IntegrationEnv } from "./env";
import { requireReadyIntegrationEnv } from "./env";

export interface DisposableContext {
  env: ReturnType<typeof requireReadyIntegrationEnv>;
  admin: SupabaseClient;
  userId: string;
  email: string;
  password: string;
  workspaceId: string;
  projectAId: string;
  projectBId: string;
  keyAId: string;
  /** In-memory only — never printed */
  keyAPlain: string;
  keyAHash: string;
  cleanup: () => Promise<void>;
  readonly cleanupOk: boolean;
}

function hashApiKey(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

function makePlainKey(): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(32);
  let out = "";
  for (let i = 0; i < 32; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return `${API_KEY_PREFIX}${out}`;
}

async function resolveWorkspaceId(
  admin: SupabaseClient,
  userId: string,
): Promise<string> {
  const existing = await admin
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing.data?.id) return existing.data.id;

  const slug = `ws-${userId.replace(/-/g, "")}`;
  const created = await admin
    .from("workspaces")
    .insert({
      name: "Integration Workspace",
      slug,
      owner_id: userId,
    })
    .select("id")
    .single();
  if (created.error || !created.data) {
    throw new Error(`workspace create failed: ${created.error?.message}`);
  }
  await admin.from("workspace_members").upsert({
    workspace_id: created.data.id,
    user_id: userId,
    role: "owner",
    status: "active",
  });
  return created.data.id;
}

export async function createDisposableContext(): Promise<DisposableContext> {
  const env = requireReadyIntegrationEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const stamp = Date.now().toString(36);
  const email = `zt-int-${stamp}@example.test`;
  const password = `Int-${stamp}-${randomBytes(8).toString("hex")}!aA1`;

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(`createUser failed: ${created.error?.message ?? "unknown"}`);
  }
  const userId = created.data.user.id;

  let workspaceId: string;
  try {
    workspaceId = await resolveWorkspaceId(admin, userId);
  } catch (e) {
    await admin.auth.admin.deleteUser(userId);
    throw e;
  }

  const projectA = await admin
    .from("projects")
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      name: `int-a-${stamp}`,
      slug: `int-a-${stamp}`,
      framework: "nextjs",
      status: "active",
    })
    .select("id")
    .single();
  if (projectA.error || !projectA.data) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error(`project A insert failed: ${projectA.error?.message}`);
  }

  const projectB = await admin
    .from("projects")
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      name: `int-b-${stamp}`,
      slug: `int-b-${stamp}`,
      framework: "nextjs",
      status: "active",
    })
    .select("id")
    .single();
  if (projectB.error || !projectB.data) {
    await admin.from("projects").delete().eq("id", projectA.data.id);
    await admin.auth.admin.deleteUser(userId);
    throw new Error(`project B insert failed: ${projectB.error?.message}`);
  }

  const keyAPlain = makePlainKey();
  const keyAHash = hashApiKey(keyAPlain);
  const keyAPrefix = keyAPlain.slice(0, API_KEY_PREFIX.length + 4);
  const keyRow = await admin
    .from("api_keys")
    .insert({
      user_id: userId,
      project_id: projectA.data.id,
      name: `int-key-a-${stamp}`,
      key_hash: keyAHash,
      key_prefix: keyAPrefix,
      environment: "development",
      status: "active",
    })
    .select("id")
    .single();
  if (keyRow.error || !keyRow.data) {
    await admin.from("projects").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId);
    throw new Error(`api key insert failed: ${keyRow.error?.message}`);
  }

  const state = { cleanupOk: true };
  const cleanup = async () => {
    try {
      await admin.from("api_key_logs").delete().eq("user_id", userId);
      await admin.from("heartbeats").delete().eq("user_id", userId);
      await admin.from("errors").delete().eq("user_id", userId);
      await admin.from("error_events").delete().eq("user_id", userId);
      await admin.from("performance_logs").delete().eq("user_id", userId);
      await admin.from("api_keys").delete().eq("user_id", userId);
      await admin.from("projects").delete().eq("user_id", userId);
      await admin.from("workspace_members").delete().eq("user_id", userId);
      await admin.from("workspaces").delete().eq("owner_id", userId);
      const del = await admin.auth.admin.deleteUser(userId);
      if (del.error) state.cleanupOk = false;
    } catch {
      state.cleanupOk = false;
      console.log("CLEANUP: FAIL (best-effort; no secrets logged)");
    }
  };

  return {
    env,
    admin,
    userId,
    email,
    password,
    workspaceId,
    projectAId: projectA.data.id,
    projectBId: projectB.data.id,
    keyAId: keyRow.data.id,
    keyAPlain,
    keyAHash,
    cleanup,
    get cleanupOk() {
      return state.cleanupOk;
    },
  };
}

export type { IntegrationEnv };
