/**
 * Read-only production schema probe via service_role REST.
 * No SQL mutations. Never prints secrets.
 */
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

load(".env.local");
load(".env.production");

const PRODUCTION_HOST = "xwxfjzyfrcaxdwvkdedq.supabase.co";
const STAGING_HOST = "qwylzdzsqjjqdkomezvg.supabase.co";
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

let host = "";
try {
  host = new URL(url).hostname.toLowerCase();
} catch {
  host = "";
}

console.log("TARGET_CHECK NEXT_PUBLIC_SUPABASE_HOST:", host || "UNSET");
console.log("TARGET_CHECK IS_PRODUCTION_HOST:", host === PRODUCTION_HOST);
console.log("TARGET_CHECK IS_STAGING_HOST:", host === STAGING_HOST);
console.log("SERVICE_ROLE_KEY:", key ? "SET" : "UNSET");

if (host !== PRODUCTION_HOST) {
  console.log("STOP: not production");
  process.exit(2);
}
if (!key) {
  console.log("STOP: service role unset");
  process.exit(3);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function rpcExists(name, args) {
  const { error } = await admin.rpc(name, args);
  if (!error) return true;
  const msg = (error.message || "").toLowerCase();
  const code = error.code || "";
  // function missing
  if (
    code === "PGRST202" ||
    msg.includes("could not find the function") ||
    msg.includes("function") && msg.includes("does not exist")
  ) {
    return false;
  }
  // exists but rejected args / auth / business rule
  return true;
}

async function columnSelectable(table, column) {
  const { error } = await admin.from(table).select(column).limit(1);
  if (!error) return true;
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("does not exist") || msg.includes("column")) return false;
  // other errors still imply column likely exists (RLS etc.)
  return !msg.includes("column");
}

const sessionsCol = await columnSelectable("profiles", "sessions_invalidated_at");
const invite = await rpcExists("accept_workspace_invitation", { p_token: "probe" });
const manage = await rpcExists("user_can_manage_project", {
  p_project_id: "00000000-0000-0000-0000-000000000000",
});
const view = await rpcExists("user_can_view_project", {
  p_project_id: "00000000-0000-0000-0000-000000000000",
});
const aiRec = await rpcExists("ai_record_usage_atomic", {
  p_user_id: "00000000-0000-0000-0000-000000000000",
  p_limit: 1,
  p_conversation_id: null,
  p_message_id: null,
  p_model: "probe",
  p_prompt_tokens: 0,
  p_completion_tokens: 0,
  p_total_tokens: 0,
});
const aiQuota = await rpcExists("ai_usage_within_limit", {
  p_user_id: "00000000-0000-0000-0000-000000000000",
  p_limit: 1,
});

// Lemon tables probe (0018) — head select
let lemon = false;
for (const t of ["billing_customers", "billing_subscriptions", "lemon_squeezy_webhook_events"]) {
  const { error } = await admin.from(t).select("*", { count: "exact", head: true });
  if (!error) lemon = true;
  else {
    const msg = (error.message || "").toLowerCase();
    if (!msg.includes("does not exist") && !msg.includes("schema cache") && error.code !== "PGRST205") {
      // ambiguous — do not claim lemon present
    }
  }
}

console.log("---READ_ONLY_SCHEMA_PROBE---");
console.log("0017_sessions_invalidated_at_column:", sessionsCol ? "PRESENT" : "ABSENT");
console.log("0019_accept_workspace_invitation:", invite ? "PRESENT" : "ABSENT");
console.log("0019_user_can_manage_project:", manage ? "PRESENT" : "ABSENT");
console.log("0020_user_can_view_project:", view ? "PRESENT" : "ABSENT");
console.log("0021_ai_record_usage_atomic:", aiRec ? "PRESENT" : "ABSENT");
console.log("0021_ai_usage_within_limit:", aiQuota ? "PRESENT" : "ABSENT");
console.log("0018_billing_tables:", lemon ? "PRESENT" : "ABSENT");
console.log("MUTATION: NO");
