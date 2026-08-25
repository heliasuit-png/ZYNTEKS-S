/**
 * Staging workspace bootstrap diagnostic. Never prints secrets.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

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

const url = process.env.STAGING_SUPABASE_URL;
const key = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log("MISSING staging creds");
  process.exit(1);
}
const host = new URL(url).hostname;
if (host === "xwxfjzyfrcaxdwvkdedq.supabase.co") {
  console.log("BLOCKED production");
  process.exit(2);
}
console.log("host_ok");

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

for (const t of ["workspaces", "workspace_members", "profiles", "projects"]) {
  const { error } = await admin.from(t).select("id").limit(1);
  console.log(
    `select ${t}:`,
    error ? `FAIL ${error.code} ${(error.message || "").slice(0, 120)}` : "OK",
  );
}

const stamp = Date.now().toString(36);
const email = `zt-diag-${stamp}@example.test`;
const password = `Diag-${stamp}-${randomBytes(6).toString("hex")}!aA1`;
const created = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (created.error || !created.data.user) {
  console.log("createUser: FAIL", created.error?.message?.slice(0, 120));
  process.exit(1);
}
const userId = created.data.user.id;
console.log("createUser: OK");

await new Promise((r) => setTimeout(r, 1500));

const ws = await admin
  .from("workspaces")
  .select("id, slug")
  .eq("owner_id", userId)
  .limit(1);
console.log(
  "workspace_after_trigger:",
  ws.error
    ? `FAIL ${ws.error.code} ${(ws.error.message || "").slice(0, 120)}`
    : `rows=${ws.data?.length ?? 0}`,
);

if (!ws.data?.length) {
  const slug = `ws-${userId.replace(/-/g, "")}`;
  const ins = await admin
    .from("workspaces")
    .insert({ name: "Diag Workspace", slug, owner_id: userId })
    .select("id")
    .single();
  console.log(
    "workspace_insert:",
    ins.error
      ? `FAIL ${ins.error.code} ${(ins.error.message || "").slice(0, 160)}`
      : "OK",
  );
}

await admin.auth.admin.deleteUser(userId);
console.log("cleanup_user: OK");
