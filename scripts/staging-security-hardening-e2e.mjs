/**
 * Staging-only Phase A security hardening E2E (disposable users).
 * Never prints secrets. Never targets production hosts/keys.
 */
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createChunks } from "@supabase/ssr/dist/module/utils/chunker.js";
import { stringToBase64URL } from "@supabase/ssr/dist/module/utils/base64url.js";

const PRODUCTION_APP = "zynteksisv.vercel.app";
const PRODUCTION_SB = "xwxfjzyfrcaxdwvkdedq.supabase.co";

const results = {
  A_workspace_self_join: "BLOCKED",
  B_member_role_status_lock: "BLOCKED",
  C_api_key_foreign_project: "BLOCKED",
  D_profile_role: "BLOCKED",
  E_profile_plan: "BLOCKED",
  F_profile_status: "BLOCKED",
  G_suspend_invalidates_session: "BLOCKED",
  H_banned_login: "BLOCKED",
  I_unban_recovery: "BLOCKED",
  J_legitimate_owner_admin: "BLOCKED",
  K_api_key_normal_create: "BLOCKED",
  L_sdk_heartbeat: "BLOCKED",
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

function fail(phase, detail) {
  set(phase, "FAIL");
  console.log(`FAIL_DETAIL ${phase}: ${detail}`);
}

function pass(phase) {
  set(phase, "PASS");
}

const baseUrl = (process.env.STAGING_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/+$/,
  "",
);
const supabaseUrl = process.env.STAGING_SUPABASE_URL || "";
const anon = process.env.STAGING_SUPABASE_ANON_KEY || "";
const service = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !anon || !service) {
  console.log("PRODUCTION SAFETY: FAIL (missing staging supabase)");
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

const admin = createClient(supabaseUrl, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ref = sbHost.split(".")[0];

function makePassword(stamp) {
  return `Sec-${stamp}-${randomBytes(8).toString("hex")}!aA1`;
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function createUser(label) {
  const stamp = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const email = `zt-sec-${label}-${stamp}@example.test`;
  const password = makePassword(stamp);
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(`createUser ${label}: ${created.error?.message || "fail"}`);
  }
  await new Promise((r) => setTimeout(r, 900));
  let ws = await admin
    .from("workspaces")
    .select("id")
    .eq("owner_id", created.data.user.id)
    .limit(1)
    .maybeSingle();
  if (!ws.data?.id) {
    const slug = `ws-${created.data.user.id.replace(/-/g, "")}`;
    const ins = await admin
      .from("workspaces")
      .insert({
        name: `Sec ${label}`,
        slug,
        owner_id: created.data.user.id,
      })
      .select("id")
      .single();
    if (ins.error) throw new Error(`workspace ${label}: ${ins.error.message}`);
    await admin.from("workspace_members").insert({
      workspace_id: ins.data.id,
      user_id: created.data.user.id,
      role: "owner",
      status: "active",
    });
    ws = ins;
  }
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
  if (error || !data.session) {
    throw new Error(`signIn ${email}: ${error?.message || "no session"}`);
  }
  return { client, session: data.session };
}

function sessionCookieHeader(session) {
  const payload = JSON.stringify(session);
  const encoded = `base64-${stringToBase64URL(payload)}`;
  const chunks = createChunks(`sb-${ref}-auth-token`, encoded);
  return chunks.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function ensureProject(userId, workspaceId, name) {
  const existing = await admin
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .limit(1)
    .maybeSingle();
  if (existing.data?.id) return existing.data.id;
  const slug = `p-${randomBytes(6).toString("hex")}`;
  const ins = await admin
    .from("projects")
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      name,
      slug,
      framework: "nextjs",
      status: "active",
    })
    .select("id")
    .single();
  if (ins.error) throw new Error(`project: ${ins.error.message}`);
  return ins.data.id;
}

async function protectedProbe(cookie) {
  return fetch(`${baseUrl}/api/workspace/search?q=zyn`, {
    method: "GET",
    headers: { Cookie: cookie },
  });
}

async function cleanupUser(userId) {
  await admin.from("api_key_logs").delete().eq("user_id", userId);
  await admin.from("api_keys").delete().eq("user_id", userId);
  await admin.from("incidents").delete().eq("user_id", userId);
  await admin.from("projects").delete().eq("user_id", userId);
  await admin.from("workspace_invitations").delete().eq("accepted_by", userId);
  await admin.from("workspace_members").delete().eq("user_id", userId);
  await admin.from("workspaces").delete().eq("owner_id", userId);
  await admin.from("user_sessions").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  const del = await admin.auth.admin.deleteUser(userId);
  return !del.error;
}

let userA = null;
let userB = null;
let plainKey = null;

try {
  // Schema probe
  const fn = await admin.rpc("accept_workspace_invitation", {
    p_token: "missing-token-probe",
  });
  // Expect error (not found / not authenticated) — function must exist
  if (fn.error && /could not find the function/i.test(fn.error.message)) {
    console.log("SCHEMA: FAIL (accept_workspace_invitation missing)");
    process.exit(1);
  }
  console.log("SCHEMA: accept_workspace_invitation present");

  userA = await createUser("a");
  userB = await createUser("b");
  const projectA = await ensureProject(userA.id, userA.workspaceId, "Proj A");
  const projectB = await ensureProject(userB.id, userB.workspaceId, "Proj B");

  const authA = await userClient(userA.email, userA.password);
  const authB = await userClient(userB.email, userB.password);

  // A — Workspace self-join
  {
    const { error } = await authB.client.from("workspace_members").insert({
      workspace_id: userA.workspaceId,
      user_id: userB.id,
      role: "developer",
      status: "active",
    });
    if (error) pass("A_workspace_self_join");
    else fail("A_workspace_self_join", "self-join INSERT was allowed");
  }

  // Invite B legitimately then accept via RPC (feeds J)
  const inviteToken = randomBytes(24).toString("hex");
  {
    const inv = await admin.from("workspace_invitations").insert({
      workspace_id: userA.workspaceId,
      email: userB.email.toLowerCase(),
      role: "developer",
      token: inviteToken,
      invited_by: userA.id,
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).select("id").single();
    if (inv.error) throw new Error(`invite: ${inv.error.message}`);

    const { data: invId, error: acceptErr } = await authB.client.rpc(
      "accept_workspace_invitation",
      { p_token: inviteToken },
    );
    if (acceptErr || !invId) {
      fail(
        "J_legitimate_owner_admin",
        `invite accept failed: ${acceptErr?.message || "no id"}`,
      );
    } else {
      const mem = await admin
        .from("workspace_members")
        .select("id, role, status")
        .eq("workspace_id", userA.workspaceId)
        .eq("user_id", userB.id)
        .maybeSingle();
      if (mem.data?.status === "active" && mem.data.role === "developer") {
        // continue; J finalized after owner role change
      } else {
        fail("J_legitimate_owner_admin", "member row missing after accept");
      }
    }
  }

  // B — Member role/status escalation
  {
    const { error: roleErr } = await authB.client
      .from("workspace_members")
      .update({ role: "owner" })
      .eq("workspace_id", userA.workspaceId)
      .eq("user_id", userB.id);
    const { error: statusErr } = await authB.client
      .from("workspace_members")
      .update({ status: "active" })
      .eq("workspace_id", userA.workspaceId)
      .eq("user_id", userB.id)
      .eq("role", "developer");
    // Force status escalation attempt from developer → try suspended self-clear later
    const { data: before } = await authB.client
      .from("workspace_members")
      .select("role, status")
      .eq("workspace_id", userA.workspaceId)
      .eq("user_id", userB.id)
      .maybeSingle();

    const escalate = await authB.client
      .from("workspace_members")
      .update({ role: "administrator", status: "active" })
      .eq("workspace_id", userA.workspaceId)
      .eq("user_id", userB.id)
      .select("role")
      .maybeSingle();

    const roleRejected =
      Boolean(roleErr) ||
      Boolean(escalate.error) ||
      escalate.data?.role === "developer" ||
      escalate.data == null;
    // Re-read via admin to confirm no escalation
    const { data: after } = await admin
      .from("workspace_members")
      .select("role, status")
      .eq("workspace_id", userA.workspaceId)
      .eq("user_id", userB.id)
      .maybeSingle();

    if (
      after?.role === "developer" &&
      after?.status === "active" &&
      roleRejected
    ) {
      pass("B_member_role_status_lock");
    } else {
      fail(
        "B_member_role_status_lock",
        `role=${after?.role} status=${after?.status} roleErr=${roleErr?.message || "-"} statusErr=${statusErr?.message || "-"}`,
      );
    }
    void before;
  }

  // J — Owner can change member role
  {
    const { error } = await authA.client
      .from("workspace_members")
      .update({ role: "administrator" })
      .eq("workspace_id", userA.workspaceId)
      .eq("user_id", userB.id);
    const { data: after } = await admin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", userA.workspaceId)
      .eq("user_id", userB.id)
      .maybeSingle();
    if (!error && after?.role === "administrator") {
      if (results.J_legitimate_owner_admin !== "FAIL") {
        pass("J_legitimate_owner_admin");
      }
      // restore to developer for cleanliness
      await admin
        .from("workspace_members")
        .update({ role: "developer" })
        .eq("workspace_id", userA.workspaceId)
        .eq("user_id", userB.id);
    } else if (results.J_legitimate_owner_admin !== "FAIL") {
      fail(
        "J_legitimate_owner_admin",
        `owner role change failed: ${error?.message || after?.role}`,
      );
    }
  }

  // C — API key foreign-project insert
  {
    const fakeHash = sha256Hex(`foreign-${randomBytes(8).toString("hex")}`);
    const { error } = await authA.client.from("api_keys").insert({
      project_id: projectB,
      user_id: userA.id,
      name: "foreign-key",
      key_hash: fakeHash,
      key_prefix: "zt_test_",
      environment: "development",
      status: "active",
    });
    if (error) pass("C_api_key_foreign_project");
    else fail("C_api_key_foreign_project", "foreign project key insert allowed");
  }

  // K — Normal API key create
  {
    const suffix = randomBytes(24).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
    const plain = `ZYN-KEY-${suffix}`;
    plainKey = plain;
    const { data, error } = await authA.client
      .from("api_keys")
      .insert({
        project_id: projectA,
        user_id: userA.id,
        name: "sec-ok-key",
        key_hash: sha256Hex(plain),
        key_prefix: plain.slice(0, 12),
        environment: "development",
        status: "active",
      })
      .select("id")
      .single();
    if (!error && data?.id) pass("K_api_key_normal_create");
    else fail("K_api_key_normal_create", error?.message || "no id");
  }

  // D/E/F — Privileged profile columns
  {
    const roleUp = await authA.client
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", userA.id)
      .select("role")
      .maybeSingle();
    const { data: roleAfter } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userA.id)
      .maybeSingle();
    if (
      (roleUp.error || roleUp.data == null) &&
      roleAfter?.role === "user"
    ) {
      pass("D_profile_role");
    } else {
      fail("D_profile_role", `role=${roleAfter?.role} err=${roleUp.error?.message}`);
    }

    const planUp = await authA.client
      .from("profiles")
      .update({ subscription_plan: "enterprise" })
      .eq("id", userA.id)
      .select("subscription_plan")
      .maybeSingle();
    const { data: planAfter } = await admin
      .from("profiles")
      .select("subscription_plan")
      .eq("id", userA.id)
      .maybeSingle();
    if (
      (planUp.error || planUp.data == null) &&
      planAfter?.subscription_plan === "free"
    ) {
      pass("E_profile_plan");
    } else {
      fail(
        "E_profile_plan",
        `plan=${planAfter?.subscription_plan} err=${planUp.error?.message}`,
      );
    }

    const statusUp = await authA.client
      .from("profiles")
      .update({ status: "banned" })
      .eq("id", userA.id)
      .select("status")
      .maybeSingle();
    const { data: statusAfter } = await admin
      .from("profiles")
      .select("status")
      .eq("id", userA.id)
      .maybeSingle();
    if (
      (statusUp.error || statusUp.data == null) &&
      statusAfter?.status === "active"
    ) {
      pass("F_profile_status");
    } else {
      fail(
        "F_profile_status",
        `status=${statusAfter?.status} err=${statusUp.error?.message}`,
      );
    }

    // Safe field still works
    const safe = await authA.client
      .from("profiles")
      .update({ full_name: "Sec User A" })
      .eq("id", userA.id)
      .select("full_name")
      .maybeSingle();
    if (safe.error || safe.data?.full_name !== "Sec User A") {
      fail(
        "J_legitimate_owner_admin",
        `safe profile update failed: ${safe.error?.message || safe.data?.full_name}`,
      );
    }
  }

  // App health for G/H/I/L
  let appUp = false;
  try {
    const health = await fetch(`${baseUrl}/api/health`);
    const healthJson = await health.json().catch(() => ({}));
    const runtimeHost = healthJson?.data?.supabaseHost || "";
    if (runtimeHost === PRODUCTION_SB) {
      console.log("APP: FAIL (runtime production supabase)");
    } else if (health.ok) {
      appUp = true;
      console.log("APP: PASS", runtimeHost || "(no host field)");
    }
  } catch (e) {
    console.log(
      "APP: DOWN",
      e instanceof Error ? e.message.slice(0, 120) : "unknown",
    );
  }

  // G — Suspend invalidates old session
  if (!appUp) {
    set("G_suspend_invalidates_session", "BLOCKED");
    set("H_banned_login", "BLOCKED");
    set("I_unban_recovery", "BLOCKED");
    set("L_sdk_heartbeat", "BLOCKED");
  } else {
    const authTarget = await userClient(userB.email, userB.password);
    const cookie = sessionCookieHeader(authTarget.session);
    const before = await protectedProbe(cookie);
    if (!(before.status === 200 || before.status === 400)) {
      // 400 may be validation; 401/302 would mean already blocked
      console.log(`G_precheck status=${before.status}`);
    }

    // Mimic suspendUser: banned + sessions_invalidated_at + revoke sessions
    const now = new Date().toISOString();
    await admin
      .from("profiles")
      .update({ status: "banned", sessions_invalidated_at: now })
      .eq("id", userB.id);
    await admin
      .from("user_sessions")
      .update({ revoked_at: now, is_current: false })
      .eq("user_id", userB.id)
      .is("revoked_at", null);

    const afterSuspend = await protectedProbe(cookie);
    if (afterSuspend.status === 401 || afterSuspend.status === 302) {
      pass("G_suspend_invalidates_session");
    } else {
      // Some routes redirect to login with 307/303
      const loc = afterSuspend.headers.get("location") || "";
      if (/login/i.test(loc) || afterSuspend.status === 303 || afterSuspend.status === 307) {
        pass("G_suspend_invalidates_session");
      } else {
        fail(
          "G_suspend_invalidates_session",
          `expected 401/redirect, got ${afterSuspend.status}`,
        );
      }
    }

    // H — Banned login / session cannot access protected API
    {
      const bannedLogin = await createClient(supabaseUrl, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
      }).auth.signInWithPassword({
        email: userB.email,
        password: userB.password,
      });
      if (bannedLogin.error || !bannedLogin.data.session) {
        // Auth-level reject is also acceptable
        pass("H_banned_login");
      } else {
        const bannedCookie = sessionCookieHeader(bannedLogin.data.session);
        const probe = await protectedProbe(bannedCookie);
        if (
          probe.status === 401 ||
          probe.status === 302 ||
          probe.status === 303 ||
          probe.status === 307 ||
          /login/i.test(probe.headers.get("location") || "")
        ) {
          pass("H_banned_login");
        } else {
          fail("H_banned_login", `banned session got ${probe.status}`);
        }
      }
    }

    // I — Unban + new login
    {
      await admin
        .from("profiles")
        .update({ status: "active" })
        .eq("id", userB.id);
      const recovered = await userClient(userB.email, userB.password);
      const cookie2 = sessionCookieHeader(recovered.session);
      const probe = await protectedProbe(cookie2);
      if (probe.status === 200 || probe.status === 400) {
        pass("I_unban_recovery");
      } else {
        fail("I_unban_recovery", `status=${probe.status}`);
      }
    }

    // L — SDK heartbeat
    if (results.K_api_key_normal_create === "PASS" && plainKey) {
      const hb = await fetch(`${baseUrl}/api/sdk/heartbeat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${plainKey}`,
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
        }),
      });
      if (hb.status === 202) pass("L_sdk_heartbeat");
      else {
        const body = await hb.text();
        fail(
          "L_sdk_heartbeat",
          `status=${hb.status} body=${body.slice(0, 180)}`,
        );
      }
    } else {
      set("L_sdk_heartbeat", "BLOCKED");
    }
  }

  // Cleanup
  const okA = userA ? await cleanupUser(userA.id) : true;
  const okB = userB ? await cleanupUser(userB.id) : true;
  if (okA && okB) pass("CLEANUP");
  else fail("CLEANUP", `a=${okA} b=${okB}`);
} catch (e) {
  console.log(
    "FATAL:",
    e instanceof Error ? e.message.slice(0, 400) : "unknown",
  );
  try {
    if (userA) await cleanupUser(userA.id);
    if (userB) await cleanupUser(userB.id);
  } catch {
    // ignore
  }
  process.exitCode = 1;
}

console.log("\nPHASE A — SECURITY HARDENING (E2E matrix)");
for (const [k, v] of Object.entries(results)) {
  console.log(`${k}: ${v}`);
}

const failed = Object.values(results).filter((v) => v === "FAIL").length;
if (failed > 0) process.exitCode = 1;
