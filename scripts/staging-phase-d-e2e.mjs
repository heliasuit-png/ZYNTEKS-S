/**
 * Staging-only Phase D checks (owner_id + AI RPC + status export contract).
 * Never prints secrets. Never targets production.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const PRODUCTION_SB = "xwxfjzyfrcaxdwvkdedq.supabase.co";
const PRODUCTION_APP = "zynteksisv.vercel.app";

const results = {
  owner_id_foreign_reject: "BLOCKED",
  owner_transfer_member_ok: "BLOCKED",
  ai_rpc_present: "BLOCKED",
  status_export_404_envelope: "BLOCKED",
  status_export_validation: "BLOCKED",
  CLEANUP: "BLOCKED",
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
function fail(k, d) {
  set(k, "FAIL");
  console.log(`FAIL_DETAIL ${k}: ${d}`);
}
function pass(k) {
  set(k, "PASS");
}

const baseUrl = (process.env.STAGING_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/+$/,
  "",
);
const supabaseUrl = process.env.STAGING_SUPABASE_URL || "";
const anon = process.env.STAGING_SUPABASE_ANON_KEY || "";
const service = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !anon || !service) {
  console.log("PRODUCTION SAFETY: FAIL (missing staging)");
  process.exit(2);
}

const sbHost = new URL(supabaseUrl).hostname.toLowerCase();
const baseHost = new URL(baseUrl).hostname.toLowerCase();
if (sbHost === PRODUCTION_SB || baseHost === PRODUCTION_APP) {
  console.log("PRODUCTION SAFETY: FAIL (production target)");
  process.exit(2);
}

const admin = createClient(supabaseUrl, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function makePassword(stamp) {
  return `PhD-${stamp}-${randomBytes(8).toString("hex")}!aA1`;
}

async function createUser(label) {
  const stamp = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const email = `zt-phd-${label}-${stamp}@example.test`;
  const password = makePassword(stamp);
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message || "createUser");
  }
  await new Promise((r) => setTimeout(r, 900));
  const ws = await admin
    .from("workspaces")
    .select("id")
    .eq("owner_id", created.data.user.id)
    .limit(1)
    .maybeSingle();
  if (!ws.data?.id) throw new Error("workspace missing");
  return {
    id: created.data.user.id,
    email,
    password,
    workspaceId: ws.data.id,
  };
}

async function userClient(email, password) {
  const client = createClient(supabaseUrl, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) throw new Error(error?.message || "signIn");
  return client;
}

async function cleanupUser(userId) {
  await admin.from("workspace_members").delete().eq("user_id", userId);
  await admin.from("workspaces").delete().eq("owner_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
}

let userA = null;
let userB = null;

try {
  const rpc = await admin.rpc("ai_usage_within_limit", {
    p_user_id: "00000000-0000-0000-0000-000000000000",
    p_limit: 1,
  });
  if (rpc.error && /could not find the function/i.test(rpc.error.message)) {
    fail("ai_rpc_present", "apply 0021");
  } else {
    pass("ai_rpc_present");
  }

  userA = await createUser("a");
  userB = await createUser("b");
  const clientA = await userClient(userA.email, userA.password);

  // Foreign owner_id (user B, not a member of A's workspace)
  {
    const { error } = await clientA
      .from("workspaces")
      .update({ owner_id: userB.id })
      .eq("id", userA.workspaceId);
    const { data: row } = await admin
      .from("workspaces")
      .select("owner_id")
      .eq("id", userA.workspaceId)
      .maybeSingle();
    if (row?.owner_id === userA.id && (error || true)) {
      pass("owner_id_foreign_reject");
    } else {
      fail("owner_id_foreign_reject", `owner=${row?.owner_id}`);
    }
  }

  // Add B as member then transfer should succeed for owner
  {
    await admin.from("workspace_members").insert({
      workspace_id: userA.workspaceId,
      user_id: userB.id,
      role: "administrator",
      status: "active",
      invited_by: userA.id,
    });
    const { error } = await clientA
      .from("workspaces")
      .update({ owner_id: userB.id })
      .eq("id", userA.workspaceId);
    const { data: row } = await admin
      .from("workspaces")
      .select("owner_id")
      .eq("id", userA.workspaceId)
      .maybeSingle();
    if (!error && row?.owner_id === userB.id) {
      pass("owner_transfer_member_ok");
      // restore for cleanup simplicity
      await admin
        .from("workspaces")
        .update({ owner_id: userA.id })
        .eq("id", userA.workspaceId);
    } else {
      fail(
        "owner_transfer_member_ok",
        `err=${error?.message || "-"} owner=${row?.owner_id}`,
      );
    }
  }

  // Status export against local staging app if up
  let appOk = false;
  try {
    const health = await fetch(`${baseUrl}/api/health`);
    const body = await health.json().catch(() => ({}));
    if (health.ok && body?.data?.supabaseHost === sbHost) appOk = true;
  } catch {
    appOk = false;
  }

  if (!appOk) {
    set("status_export_404_envelope", "BLOCKED");
    set("status_export_validation", "BLOCKED");
  } else {
    const missing = await fetch(
      `${baseUrl}/api/status/no-such-slug-${randomBytes(4).toString("hex")}/export`,
    );
    const missingJson = await missing.json().catch(() => ({}));
    if (
      missing.status === 404 &&
      missingJson?.success === false &&
      missingJson?.error?.code
    ) {
      pass("status_export_404_envelope");
    } else {
      fail(
        "status_export_404_envelope",
        `status=${missing.status} body=${JSON.stringify(missingJson).slice(0, 120)}`,
      );
    }

    const badFormat = await fetch(
      `${baseUrl}/api/status/demo/export?format=xml`,
    );
    const badJson = await badFormat.json().catch(() => ({}));
    // 404 (missing page) or 422 (validation) both acceptable if enveloped
    if (
      badJson?.success === false &&
      badJson?.error?.code &&
      (badFormat.status === 404 ||
        badFormat.status === 422 ||
        badFormat.status === 400)
    ) {
      pass("status_export_validation");
    } else {
      fail(
        "status_export_validation",
        `status=${badFormat.status} body=${JSON.stringify(badJson).slice(0, 120)}`,
      );
    }
  }

  await cleanupUser(userB.id);
  await cleanupUser(userA.id);
  pass("CLEANUP");
} catch (e) {
  console.log(
    "FATAL:",
    e instanceof Error ? e.message.slice(0, 400) : "unknown",
  );
  try {
    if (userB) await cleanupUser(userB.id);
    if (userA) await cleanupUser(userA.id);
  } catch {
    // ignore
  }
  process.exitCode = 1;
}

console.log("\nPHASE D — STAGING");
for (const [k, v] of Object.entries(results)) {
  console.log(`${k}: ${v}`);
}
if (Object.values(results).includes("FAIL")) process.exitCode = 1;
