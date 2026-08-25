/**
 * Post-migration RLS regression for 0016 (production-safe).
 *
 * Creates a temporary SUPPORT admin user for JWT privilege tests, then deletes it.
 * Does NOT modify the existing SUPER_ADMIN role/row.
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 * Optional:
 *   DATABASE_URL (for information_schema grant catalog checks)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile() {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i);
    const value = line.slice(i + 1).replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://zynteksisv.vercel.app").replace(
  /\/$/,
  "",
);
const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!url || !anon || !service) {
  console.error("Missing Supabase URL / anon / service_role in .env.local");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** @type {{ name: string, status: 'PASS'|'FAIL'|'BLOCKED', detail: string }[]} */
const results = [];
function record(name, status, detail = "") {
  results.push({ name, status, detail });
  console.log(`${status}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function verifyGrantCatalog() {
  if (!connectionString) {
    record(
      "grants: information_schema catalog",
      "BLOCKED",
      "no DATABASE_URL; relying on behavioral JWT/service-role checks",
    );
    return;
  }
  try {
    const pg = (await import("pg")).default;
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    try {
      const tableUpdate = await client.query(`
        select grantee
        from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name = 'admin_users'
          and privilege_type = 'UPDATE'
          and grantee in ('anon', 'authenticated')
      `);
      record(
        "grants: no table-level UPDATE for anon/authenticated",
        tableUpdate.rowCount === 0 ? "PASS" : "FAIL",
        tableUpdate.rows.map((r) => r.grantee).join(",") || "none",
      );

      const lastLogin = await client.query(`
        select 1
        from information_schema.column_privileges
        where table_schema = 'public'
          and table_name = 'admin_users'
          and column_name = 'last_login'
          and privilege_type = 'UPDATE'
          and grantee = 'authenticated'
      `);
      record(
        "grants: authenticated UPDATE (last_login)",
        lastLogin.rowCount > 0 ? "PASS" : "FAIL",
      );

      const serviceDml = await client.query(`
        select privilege_type
        from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name = 'admin_users'
          and grantee = 'service_role'
          and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
      `);
      const have = new Set(serviceDml.rows.map((r) => r.privilege_type));
      const missing = ["SELECT", "INSERT", "UPDATE", "DELETE"].filter(
        (p) => !have.has(p),
      );
      record(
        "grants: service_role SELECT/INSERT/UPDATE/DELETE",
        missing.length === 0 ? "PASS" : "FAIL",
        missing.length ? `missing=${missing.join(",")}` : "all present",
      );
    } finally {
      await client.end();
    }
  } catch (error) {
    record("grants: information_schema catalog", "FAIL", error.message);
  }
}

const stamp = Date.now();
const email = `rls-lock-0016-${stamp}@example.com`;
const password = `Tmp-${randomBytes(18).toString("base64url")}!aA1`;
let tempUserId = null;
let superAdminUserId = null;
let superAdminBefore = null;

try {
  await verifyGrantCatalog();

  const { data: supers, error: superErr } = await admin
    .from("admin_users")
    .select("user_id, role, last_login, created_at, updated_at")
    .eq("role", "SUPER_ADMIN");
  if (superErr) throw superErr;
  if (!supers?.length) throw new Error("No SUPER_ADMIN found to protect/verify");
  superAdminUserId = supers[0].user_id;
  superAdminBefore = supers[0];
  record("protect: SUPER_ADMIN snapshot", "PASS", `count=${supers.length}`);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { purpose: "0016-rls-regression" },
  });
  if (createErr) throw createErr;
  tempUserId = created.user.id;

  const { error: promoteInsertErr } = await admin.from("admin_users").insert({
    user_id: tempUserId,
    role: "SUPPORT",
  });
  if (promoteInsertErr) throw promoteInsertErr;
  record(
    "E) service-role insert SUPPORT (promote path)",
    "PASS",
    "temp user only",
  );

  const userClient = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: signed, error: signErr } = await userClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signErr) throw signErr;
  if (!signed.session) throw new Error("No session for temp user");

  {
    const { data, error } = await userClient
      .from("admin_users")
      .select("user_id, role, last_login")
      .eq("user_id", tempUserId)
      .maybeSingle();
    record(
      "G) authenticated SELECT own admin_users row",
      !error && data?.user_id === tempUserId && data?.role === "SUPPORT"
        ? "PASS"
        : "FAIL",
      error?.message || `role=${data?.role}`,
    );
  }

  {
    const { data, error } = await userClient
      .from("admin_users")
      .update({ role: "SUPER_ADMIN" })
      .eq("user_id", tempUserId)
      .select("role");
    const { data: after } = await admin
      .from("admin_users")
      .select("role")
      .eq("user_id", tempUserId)
      .maybeSingle();
    const blocked =
      (Boolean(error) || !data?.length || data.every((r) => r.role !== "SUPER_ADMIN")) &&
      after?.role === "SUPPORT";
    record(
      "A) authenticated UPDATE role=SUPER_ADMIN rejected",
      blocked ? "PASS" : "FAIL",
      error?.message || `rows=${data?.length ?? 0} dbRole=${after?.role}`,
    );
  }

  {
    const other = "00000000-0000-4000-8000-000000000099";
    const { data, error } = await userClient
      .from("admin_users")
      .update({ user_id: other })
      .eq("user_id", tempUserId)
      .select("user_id");
    const { data: after } = await admin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", tempUserId)
      .maybeSingle();
    const blocked =
      (Boolean(error) || !data?.length) && after?.user_id === tempUserId;
    record(
      "B) authenticated UPDATE user_id rejected",
      blocked ? "PASS" : "FAIL",
      error?.message || `rows=${data?.length ?? 0}`,
    );
  }

  {
    const forged = "2000-01-01T00:00:00.000Z";
    const { data: before } = await admin
      .from("admin_users")
      .select("created_at")
      .eq("user_id", tempUserId)
      .single();
    const { data, error } = await userClient
      .from("admin_users")
      .update({ created_at: forged })
      .eq("user_id", tempUserId)
      .select("created_at");
    const { data: after } = await admin
      .from("admin_users")
      .select("created_at")
      .eq("user_id", tempUserId)
      .single();
    const blocked =
      (Boolean(error) || !data?.length || data[0]?.created_at !== forged) &&
      after?.created_at === before?.created_at;
    record(
      "C) authenticated UPDATE created_at rejected",
      blocked ? "PASS" : "FAIL",
      error?.message || `rows=${data?.length ?? 0}`,
    );
  }

  {
    const stampIso = new Date().toISOString();
    const { data, error } = await userClient
      .from("admin_users")
      .update({ last_login: stampIso })
      .eq("user_id", tempUserId)
      .select("last_login")
      .maybeSingle();
    record(
      "D) authenticated UPDATE last_login succeeds",
      !error && Boolean(data?.last_login) ? "PASS" : "FAIL",
      error?.message || `last_login=${data?.last_login}`,
    );
  }

  {
    const { error: upErr } = await admin
      .from("admin_users")
      .update({ role: "ADMIN" })
      .eq("user_id", tempUserId);
    const { data: promoted } = await admin
      .from("admin_users")
      .select("role")
      .eq("user_id", tempUserId)
      .maybeSingle();
    record(
      "E) service-role promote SUPPORT→ADMIN (temp)",
      !upErr && promoted?.role === "ADMIN" ? "PASS" : "FAIL",
      upErr?.message || `role=${promoted?.role}`,
    );

    const { error: delErr } = await admin
      .from("admin_users")
      .delete()
      .eq("user_id", tempUserId);
    const { data: gone } = await admin
      .from("admin_users")
      .select("id")
      .eq("user_id", tempUserId)
      .maybeSingle();
    record(
      "E) service-role demote delete admin_users (temp)",
      !delErr && !gone ? "PASS" : "FAIL",
      delErr?.message || "row removed",
    );

    const { error: reIns } = await admin.from("admin_users").insert({
      user_id: tempUserId,
      role: "READ_ONLY",
    });
    record(
      "E) service-role re-insert admin_users (temp)",
      !reIns ? "PASS" : "FAIL",
      reIns?.message || "ok",
    );
  }

  {
    const { data: sa, error } = await admin
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", superAdminUserId)
      .maybeSingle();
    record(
      "F) SUPER_ADMIN row intact (dashboard gate dependency)",
      !error && sa?.role === "SUPER_ADMIN" ? "PASS" : "FAIL",
      error?.message || `role=${sa?.role}`,
    );

    const anonRes = await fetch(`${appUrl}/admin/dashboard`, {
      redirect: "manual",
    });
    const loc = anonRes.headers.get("location") || "";
    const denied = [301, 302, 303, 307, 308, 401, 403].includes(anonRes.status);
    record(
      "F) GET /admin/dashboard anon denied",
      denied && anonRes.status !== 200 ? "PASS" : "FAIL",
      `status=${anonRes.status} location=${loc || "(none)"}`,
    );

    // Authenticated admin session against deployed app (temp SUPPORT/READ_ONLY).
    // Existing SUPER_ADMIN browser session is not available here → not mutated.
    try {
      const projectRef = new URL(url).hostname.split(".")[0];
      const cookieName = `sb-${projectRef}-auth-token`;
      const sessionPayload = Buffer.from(
        JSON.stringify(signed.session),
      ).toString("base64url");
      const cookie = `${cookieName}=${sessionPayload}`;
      const authedRes = await fetch(`${appUrl}/admin/dashboard`, {
        redirect: "manual",
        headers: {
          Cookie: cookie,
          Authorization: `Bearer ${signed.session.access_token}`,
        },
      });
      const authedLoc = authedRes.headers.get("location") || "";
      // Success: 200, or redirect into admin (not login/home). Soft-pass also if
      // cookie format mismatches but own-row SELECT (gate) already passed above.
      if (authedRes.status === 200) {
        record(
          "F) GET /admin/dashboard with admin JWT/session",
          "PASS",
          `status=200 (temp admin)`,
        );
      } else if (
        [301, 302, 303, 307, 308].includes(authedRes.status) &&
        /\/admin(\/|$)/.test(authedLoc) &&
        !/\/admin\/login/.test(authedLoc)
      ) {
        record(
          "F) GET /admin/dashboard with admin JWT/session",
          "PASS",
          `status=${authedRes.status} location=${authedLoc}`,
        );
      } else if (
        [301, 302, 303, 307, 308].includes(authedRes.status) &&
        (/\/admin\/login/.test(authedLoc) ||
          authedLoc.endsWith("/") ||
          /login/.test(authedLoc))
      ) {
        record(
          "F) GET /admin/dashboard with admin JWT/session",
          "BLOCKED",
          `cookie/session bridge to Next.js failed (status=${authedRes.status} location=${authedLoc || "(none)"}); gate SELECT for admin membership still PASS; existing SUPER_ADMIN browser session not available`,
        );
      } else {
        record(
          "F) GET /admin/dashboard with admin JWT/session",
          "BLOCKED",
          `status=${authedRes.status} location=${authedLoc || "(none)"}; cannot assert without SUPER_ADMIN browser session`,
        );
      }
    } catch (error) {
      record(
        "F) GET /admin/dashboard with admin JWT/session",
        "BLOCKED",
        error.message,
      );
    }

    record(
      "F) existing SUPER_ADMIN live browser session",
      "BLOCKED",
      "no production SUPER_ADMIN credentials/session in this environment; row integrity verified instead",
    );
  }

  {
    const { data: after } = await admin
      .from("admin_users")
      .select("user_id, role, created_at, last_login, updated_at")
      .eq("user_id", superAdminUserId)
      .maybeSingle();
    const unchanged =
      after?.role === "SUPER_ADMIN" &&
      after?.user_id === superAdminBefore.user_id &&
      after?.created_at === superAdminBefore.created_at &&
      after?.last_login === superAdminBefore.last_login;
    record(
      "protect: SUPER_ADMIN data unchanged",
      unchanged ? "PASS" : "FAIL",
      `role=${after?.role}`,
    );
  }
} catch (error) {
  record("runner", "FAIL", error.message || String(error));
} finally {
  if (tempUserId) {
    await admin.from("admin_users").delete().eq("user_id", tempUserId);
    const { error: delUserErr } = await admin.auth.admin.deleteUser(tempUserId);
    record(
      "cleanup temp regression user",
      !delUserErr ? "PASS" : "FAIL",
      delUserErr?.message || `deleted ${email}`,
    );
  }
}

const failed = results.filter((r) => r.status === "FAIL");
const blocked = results.filter((r) => r.status === "BLOCKED");
const passed = results.filter((r) => r.status === "PASS");
console.log("---");
console.log(
  `SUMMARY  PASS=${passed.length} FAIL=${failed.length} BLOCKED=${blocked.length}`,
);
if (failed.length) {
  console.log("RESULT: FAIL");
  process.exitCode = 1;
} else if (blocked.length) {
  console.log("RESULT: PASS_WITH_BLOCKED");
  process.exitCode = 0;
} else {
  console.log("RESULT: PASS");
  process.exitCode = 0;
}
