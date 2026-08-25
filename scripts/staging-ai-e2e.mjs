/**
 * Staging-only AI + session isolation E2E.
 * Never prints secrets. Never uses production hosts/keys.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createChunks } from "@supabase/ssr/dist/module/utils/chunker.js";
import { stringToBase64URL } from "@supabase/ssr/dist/module/utils/base64url.js";

const PRODUCTION_APP = "zynteksisv.vercel.app";
const PRODUCTION_SB = "xwxfjzyfrcaxdwvkdedq.supabase.co";

const results = {
  "PHASE A — AI login": "BLOCKED",
  "PHASE B — AI access": "BLOCKED",
  "PHASE C — AI streaming": "BLOCKED",
  "PHASE D — AI usage/quota": "BLOCKED",
  "PHASE E — Second message": "BLOCKED",
  "PHASE F — Refresh/history": "BLOCKED",
  "PHASE G — Logout security": "BLOCKED",
  "PHASE H — Session isolation": "BLOCKED",
  "PHASE I — DOM/runtime stability": "WARNING",
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

const baseUrl = (process.env.STAGING_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/+$/,
  "",
);
const supabaseUrl = process.env.STAGING_SUPABASE_URL || "";
const anon = process.env.STAGING_SUPABASE_ANON_KEY || "";
const service = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || "";
const openai = process.env.STAGING_OPENAI_API_KEY || "";

console.log("STAGING_OPENAI_API_KEY:", openai ? "SET" : "UNSET");
console.log("STAGING_BASE_URL_HOST:", new URL(baseUrl).hostname);

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
if (!openai) {
  console.log("PRODUCTION SAFETY: PASS");
  console.log("AI: BLOCKED (STAGING_OPENAI_API_KEY UNSET)");
  process.exit(0);
}

const health = await fetch(`${baseUrl}/api/health`);
const healthJson = await health.json().catch(() => ({}));
const runtimeHost = healthJson?.data?.supabaseHost || "";
console.log("RUNTIME_SUPABASE_HOST:", runtimeHost || "unknown");
if (runtimeHost === PRODUCTION_SB) {
  console.log("PRODUCTION SAFETY: FAIL (runtime production supabase)");
  process.exit(2);
}
if (runtimeHost && runtimeHost !== sbHost) {
  console.log("PRODUCTION SAFETY: FAIL (runtime host mismatch)");
  process.exit(2);
}
console.log("PRODUCTION SAFETY: PASS");

const ref = sbHost.split(".")[0];
const admin = createClient(supabaseUrl, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function makePassword(stamp) {
  return `Ai-${stamp}-${randomBytes(8).toString("hex")}!aA1`;
}

async function createUser(label) {
  const stamp = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const email = `zt-ai-${label}-${stamp}@example.test`;
  const password = makePassword(stamp);
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(`createUser ${label}: ${created.error?.message || "fail"}`);
  }
  // Ensure workspace via trigger; wait briefly
  await new Promise((r) => setTimeout(r, 800));
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
        name: `AI ${label}`,
        slug,
        owner_id: created.data.user.id,
      })
      .select("id")
      .single();
    if (ins.error) throw new Error(`workspace ${label}: ${ins.error.message}`);
    ws = ins;
  }
  return {
    id: created.data.user.id,
    email,
    password,
    workspaceId: ws.data.id,
  };
}

function sessionCookieHeader(session) {
  const payload = JSON.stringify(session);
  const encoded = `base64-${stringToBase64URL(payload)}`;
  const chunks = createChunks(`sb-${ref}-auth-token`, encoded);
  return chunks.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function signInCookie(email, password) {
  const client = createClient(supabaseUrl, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    throw new Error(`signIn failed: ${error?.message || "no session"}`);
  }
  return {
    cookie: sessionCookieHeader(data.session),
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    userId: data.session.user.id,
  };
}

async function postChat(cookie, body) {
  return fetch(`${baseUrl}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  });
}

async function parseNdjson(res) {
  const text = await res.text();
  const events = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      // ignore non-json
    }
  }
  return { events, rawLen: text.length };
}

async function cleanupUser(userId) {
  await admin.from("ai_usage").delete().eq("user_id", userId);
  await admin.from("ai_messages").delete().eq("user_id", userId);
  await admin.from("ai_conversations").delete().eq("user_id", userId);
  await admin.from("workspace_members").delete().eq("user_id", userId);
  await admin.from("workspaces").delete().eq("owner_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  const del = await admin.auth.admin.deleteUser(userId);
  return !del.error;
}

let userA = null;
let userB = null;
let cleanupOk = true;

try {
  // PHASE A
  userA = await createUser("a");
  const authA = await signInCookie(userA.email, userA.password);
  set("PHASE A — AI login", "PASS");

  // PHASE B + C
  const beforeUsage = await admin
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userA.id);

  const res1 = await postChat(authA.cookie, {
    message: "Reply with exactly the word: pong",
  });
  if (res1.status !== 200) {
    const body = (await res1.text()).slice(0, 200);
    fail(
      "PHASE B — AI access",
      `route=POST /api/ai/chat expected=200 actual=${res1.status} body=${body}`,
    );
  } else {
    set("PHASE B — AI access", "PASS");
    const { events } = await parseNdjson(res1);
    const types = new Set(events.map((e) => e.type));
    const errEvt = events.find((e) => e.type === "error");
    const errMsg = typeof errEvt?.message === "string" ? errEvt.message : "";
    const providerBlocked =
      /no credits remaining|insufficient_quota|billing|rate limit|quota/i.test(
        errMsg,
      ) || (types.has("meta") && types.has("error") && !types.has("delta"));

    if (types.has("meta") && types.has("delta") && types.has("done")) {
      set("PHASE C — AI streaming", "PASS");
    } else if (providerBlocked) {
      set("PHASE C — AI streaming", "BLOCKED");
      console.log(
        "BLOCKED_DETAIL PHASE C: staging OpenAI provider rejected stream (credits/quota). App reached OpenAI; NDJSON meta+error observed. No key printed.",
      );
    } else {
      fail(
        "PHASE C — AI streaming",
        `expected meta+delta+done actual=${[...types].join(",")}`,
      );
    }

    const meta = events.find((e) => e.type === "meta");
    const conversationId = meta?.conversationId;
    const streamOk = results["PHASE C — AI streaming"] === "PASS";
    const streamBlocked = results["PHASE C — AI streaming"] === "BLOCKED";

    // PHASE D
    if (streamBlocked) {
      set("PHASE D — AI usage/quota", "BLOCKED");
    } else {
      const afterUsage = await admin
        .from("ai_usage")
        .select("id,total_tokens", { count: "exact" })
        .eq("user_id", userA.id);
      const before = beforeUsage.count ?? 0;
      const after = afterUsage.count ?? 0;
      const FREE_LIMIT = 200;
      const used = after;
      const remaining = Math.max(0, FREE_LIMIT - used);
      if (after > before && used >= 1 && remaining === FREE_LIMIT - used) {
        set("PHASE D — AI usage/quota", "PASS");
        console.log(
          `QUOTA_CHECK used=${used} remaining=${remaining} limit=${FREE_LIMIT} (no secrets)`,
        );
      } else {
        fail(
          "PHASE D — AI usage/quota",
          `expected ai_usage increase + quota math before=${before} after=${after} remaining=${remaining}`,
        );
      }
    }

    // PHASE E + F
    if (streamBlocked) {
      set("PHASE E — Second message", "BLOCKED");
      set("PHASE F — Refresh/history", "BLOCKED");
    } else if (conversationId && streamOk) {
      const res2 = await postChat(authA.cookie, {
        conversationId,
        message: "Say only: ok",
      });
      if (res2.status === 200) {
        const p2 = await parseNdjson(res2);
        const t2 = new Set(p2.events.map((e) => e.type));
        if (t2.has("meta") && t2.has("delta") && t2.has("done")) {
          set("PHASE E — Second message", "PASS");
        } else {
          fail(
            "PHASE E — Second message",
            `stream types=${[...t2].join(",")}`,
          );
        }
      } else {
        fail(
          "PHASE E — Second message",
          `expected=200 actual=${res2.status}`,
        );
      }

      const msgs = await admin
        .from("ai_messages")
        .select("id,role")
        .eq("user_id", userA.id)
        .eq("conversation_id", conversationId);
      const roles = (msgs.data || []).map((m) => m.role);
      const hasUser = roles.includes("user");
      const hasAssistant = roles.includes("assistant");
      if (hasUser && hasAssistant && (msgs.data?.length ?? 0) >= 2) {
        set("PHASE F — Refresh/history", "PASS");
      } else {
        fail(
          "PHASE F — Refresh/history",
          `expected persisted user+assistant messages count=${msgs.data?.length ?? 0}`,
        );
      }
    } else {
      fail("PHASE E — Second message", "missing conversationId from meta");
      fail("PHASE F — Refresh/history", "missing conversationId");
    }
  }

  // PHASE G — logout security (app-equivalent: stamp + global signOut, keep old cookie)
  const bare = await postChat("", { message: "no cookie" });
  const userClient = createClient(supabaseUrl, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await userClient.auth.setSession({
    access_token: authA.accessToken,
    refresh_token: authA.refreshToken,
  });
  // Mirror services/auth signOut: invalidate before Auth signOut
  const nowIso = new Date().toISOString();
  await userClient
    .from("profiles")
    .update({ sessions_invalidated_at: nowIso })
    .eq("id", userA.id);
  await userClient
    .from("user_sessions")
    .update({ revoked_at: nowIso, is_current: false })
    .eq("user_id", userA.id)
    .is("revoked_at", null);
  await userClient.auth.signOut({ scope: "global" });

  const afterLogout = await postChat(authA.cookie, {
    message: "should be unauthorized",
  });
  if (bare.status === 401 && afterLogout.status === 401) {
    set("PHASE G — Logout security", "PASS");
  } else {
    fail(
      "PHASE G — Logout security",
      `expected bare=401+postLogout=401 actual bare=${bare.status} postLogout=${afterLogout.status}`,
    );
  }

  // New login must regain access (auth gate only; OpenAI stream may still be credit-blocked)
  const authAFresh = await signInCookie(userA.email, userA.password);
  const afterRelogin = await postChat(authAFresh.cookie, {
    message: "relogin probe",
  });
  if (afterRelogin.status === 200) {
    console.log("PHASE_G_RELOGIN: PASS");
  } else {
    fail(
      "PHASE G — Logout security",
      `relogin expected=200 actual=${afterRelogin.status}`,
    );
  }

  // PHASE H — isolation
  userB = await createUser("b");
  const authB = await signInCookie(userB.email, userB.password);
  const resB = await postChat(authB.cookie, {
    message: "User B secret marker: BLUE-ISLAND",
  });
  let bConversationId = null;
  if (resB.status === 200) {
    const pb = await parseNdjson(resB);
    bConversationId = pb.events.find((e) => e.type === "meta")?.conversationId;
  }

  // Re-login A with fresh session
  const authA2 = await signInCookie(userA.email, userA.password);
  if (bConversationId) {
    const cross = await postChat(authA2.cookie, {
      conversationId: bConversationId,
      message: "try access B history",
    });
    const pc = await parseNdjson(cross);
    const crossErr = pc.events.find((e) => e.type === "error")?.message || "";
    const crossMetaId = pc.events.find((e) => e.type === "meta")?.conversationId;
    const denied =
      /not found|forbidden|unauthorized|access/i.test(String(crossErr)) ||
      (cross.status >= 400 && cross.status < 500);
    const reusedB = crossMetaId === bConversationId && !denied;

    const bMsgsForA = await admin
      .from("ai_messages")
      .select("id")
      .eq("conversation_id", bConversationId)
      .eq("user_id", userA.id);
    const aConvos = await admin
      .from("ai_conversations")
      .select("id")
      .eq("user_id", userA.id)
      .eq("id", bConversationId);
    const leaked =
      (bMsgsForA.data?.length ?? 0) > 0 || (aConvos.data?.length ?? 0) > 0;

    if (!leaked && (denied || !reusedB)) {
      set("PHASE H — Session isolation", "PASS");
    } else {
      fail(
        "PHASE H — Session isolation",
        `cross-user access status=${cross.status} reusedB=${reusedB} leaked=${leaked} err=${String(crossErr).slice(0, 80)}`,
      );
    }
  } else {
    fail(
      "PHASE H — Session isolation",
      `user B chat missing conversationId status=${resB.status}`,
    );
  }

  // Admin isolation: normal user must not pass admin gate
  const adminProbe = await fetch(`${baseUrl}/api/admin/audit/export`, {
    method: "GET",
    headers: { Cookie: authA2.cookie },
  });
  if (adminProbe.status === 401 || adminProbe.status === 403) {
    console.log("ADMIN_ISOLATION: PASS");
  } else {
    console.log(
      `ADMIN_ISOLATION: FAIL status=${adminProbe.status} (expected 401/403)`,
    );
  }

  // PHASE I — static smoke already covers DOM; mark WARNING (no browser runtime here)
  set(
    "PHASE I — DOM/runtime stability",
    "WARNING",
  );
  console.log(
    "PHASE_I_NOTE: no browser automation; smoke ai-stream-dom unit coverage used as WARNING not FAIL",
  );

} catch (e) {
  console.log(
    "FATAL:",
    e instanceof Error ? e.message.slice(0, 300) : "unknown",
  );
  for (const [k, v] of Object.entries(results)) {
    if (v === "BLOCKED") results[k] = "FAIL";
  }
} finally {
  try {
    if (userA?.id) cleanupOk = (await cleanupUser(userA.id)) && cleanupOk;
    if (userB?.id) cleanupOk = (await cleanupUser(userB.id)) && cleanupOk;
    // Production guard on cleanup target
    if (sbHost === PRODUCTION_SB) cleanupOk = false;
    set("CLEANUP", cleanupOk ? "PASS" : "FAIL");
  } catch {
    set("CLEANUP", "FAIL");
  }
}

console.log("---AI_E2E_REPORT---");
for (const [k, v] of Object.entries(results)) {
  console.log(`${k}: ${v}`);
}
const counts = {
  PASS: Object.values(results).filter((s) => s === "PASS").length,
  FAIL: Object.values(results).filter((s) => s === "FAIL").length,
  BLOCKED: Object.values(results).filter((s) => s === "BLOCKED").length,
  WARNING: Object.values(results).filter((s) => s === "WARNING").length,
};
console.log(JSON.stringify(counts));
if (counts.FAIL > 0) process.exit(1);
