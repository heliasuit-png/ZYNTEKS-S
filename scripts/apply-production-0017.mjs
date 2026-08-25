/**
 * Apply ONLY 0017_sessions_invalidated_at.sql to PRODUCTION Supabase.
 * Uses Shared Pooler (Supavisor) Session mode by default:
 *   user = postgres.<PROJECT_REF>
 *   host = aws-<N>-<REGION>.pooler.supabase.com
 *   port = 5432
 *   database = postgres
 *   ssl = required
 *
 * Refuses staging. Never prints secrets. No Vercel deploy.
 * Does not apply migration unless CONNECT: PASS.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { resolve4, resolve6 } from "node:dns/promises";
import pg from "pg";

const { Client } = pg;

const PRODUCTION_HOST = "xwxfjzyfrcaxdwvkdedq.supabase.co";
const PRODUCTION_REF = "xwxfjzyfrcaxdwvkdedq";
const STAGING_HOST = "qwylzdzsqjjqdkomezvg.supabase.co";
const STAGING_REF = "qwylzdzsqjjqdkomezvg";
const MIGRATION_FILE = "0017_sessions_invalidated_at.sql";
const POOLER_USER = `postgres.${PRODUCTION_REF}`;
const SESSION_PORT = 5432;
const TRANSACTION_PORT = 6543;

function loadEnvFile(name) {
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
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.production");

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Strip password / connection-string material from error text. */
function safeError(err) {
  let msg = err instanceof Error ? err.message : String(err);
  msg = msg.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "postgresql://REDACTED");
  if (password) {
    const esc = password.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    msg = msg.replace(new RegExp(esc, "g"), "[REDACTED]");
  }
  return msg.slice(0, 200);
}

const publicUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const publicHost = hostOf(publicUrl);
console.log("TARGET_CHECK NEXT_PUBLIC_SUPABASE_HOST:", publicHost || "UNSET");
console.log("TARGET_CHECK IS_PRODUCTION_HOST:", publicHost === PRODUCTION_HOST);
console.log("TARGET_CHECK IS_STAGING_HOST:", publicHost === STAGING_HOST);

if (publicHost !== PRODUCTION_HOST) {
  console.log(
    "BLOCKED: NEXT_PUBLIC_SUPABASE_URL must be production host before applying 0017",
  );
  process.exit(2);
}

const password =
  process.env.SUPABASE_DB_PASSWORD?.trim() ||
  process.env.DB_PASSWORD?.trim() ||
  process.env.POSTGRES_PASSWORD?.trim() ||
  "";

console.log("SUPABASE_DB_PASSWORD:", password ? "SET" : "UNSET");
console.log("POOLER_USER:", POOLER_USER);
console.log("POOLER_MODE: session-first (port", SESSION_PORT + ")");

async function tryClient(label, config) {
  const client = new Client(config);
  try {
    await client.connect();
    await client.query("select 1 as ok");
    console.log(`CONNECT: PASS via ${label}`);
    return client;
  } catch (e) {
    console.log(`CONNECT ${label}: FAIL (${safeError(e)})`);
    try {
      await client.end();
    } catch {
      // ignore
    }
    return null;
  }
}

function assertProductionConnectionString(value, label) {
  const lower = value.toLowerCase();
  if (lower.includes(STAGING_REF) || lower.includes(STAGING_HOST)) {
    console.log(`BLOCKED: ${label} points at staging`);
    process.exit(2);
  }
  if (
    !lower.includes(PRODUCTION_REF) &&
    !lower.includes(PRODUCTION_HOST) &&
    !lower.includes(`db.${PRODUCTION_REF}`)
  ) {
    console.log(
      `BLOCKED: ${label} does not clearly identify production ref/host`,
    );
    process.exit(2);
  }
}

function assertProductionPoolerHost(host) {
  const h = host.toLowerCase();
  if (h.includes(STAGING_REF) || h.includes(STAGING_HOST)) {
    console.log("BLOCKED: pooler host points at staging");
    process.exit(2);
  }
  if (!h.endsWith(".pooler.supabase.com")) {
    console.log("BLOCKED: pooler host must be *.pooler.supabase.com");
    process.exit(2);
  }
}

/**
 * Session pooler config matching Dashboard → Connect → Session pooler:
 * postgres://postgres.<ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres
 */
function sessionPoolerConfig(host) {
  return {
    host,
    port: SESSION_PORT,
    user: POOLER_USER,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  };
}

function transactionPoolerConfig(host) {
  return {
    host,
    port: TRANSACTION_PORT,
    user: POOLER_USER,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  };
}

async function connectProduction() {
  // 1) Explicit connection strings (must be production)
  for (const k of [
    "DATABASE_URL",
    "SUPABASE_DB_URL",
    "SUPABASE_DATABASE_URL",
    "POSTGRES_URL",
  ]) {
    const v = process.env[k]?.trim();
    if (!v) continue;
    assertProductionConnectionString(v, k);
    console.log(`TRY: ${k}`);
    const client = await tryClient(k, {
      connectionString: v,
      ssl: { rejectUnauthorized: false },
    });
    if (client) return client;
  }

  if (!password) {
    console.log(
      "BLOCKED: production DB password / DATABASE_URL missing (no secrets printed)",
    );
    process.exit(3);
  }

  // 2) Explicit Session pooler host from env (Dashboard Connect → Session pooler host)
  const explicitPooler =
    process.env.SUPABASE_POOLER_HOST?.trim() ||
    process.env.PRODUCTION_POOLER_HOST?.trim() ||
    "";
  if (explicitPooler) {
    assertProductionPoolerHost(explicitPooler);
    console.log("TRY: explicit session pooler host (SET, value not printed)");
    const c = await tryClient(
      "session-pooler-explicit",
      sessionPoolerConfig(explicitPooler),
    );
    if (c) return c;
  }

  // 3) Shared Pooler Session mode (preferred for Windows/IPv4 + migrations)
  const regions = [
    "eu-central-1",
    "eu-west-1",
    "eu-west-2",
    "eu-north-1",
    "us-east-1",
    "us-west-1",
    "us-west-2",
    "ap-southeast-1",
    "ap-northeast-1",
  ];
  const awsPrefixes = ["aws-0", "aws-1"];

  console.log("TRY: Shared Pooler Session mode (port 5432, user postgres.<ref>)");
  for (const aws of awsPrefixes) {
    for (const region of regions) {
      const poolerHost = `${aws}-${region}.pooler.supabase.com`;
      const c = await tryClient(
        `session-pooler-${aws}-${region}`,
        sessionPoolerConfig(poolerHost),
      );
      if (c) return c;
    }
  }

  // 4) Fallback: Shared Pooler Transaction mode (port 6543) — same user format
  console.log("TRY: Shared Pooler Transaction mode fallback (port 6543)");
  for (const aws of awsPrefixes) {
    for (const region of regions) {
      const poolerHost = `${aws}-${region}.pooler.supabase.com`;
      const c = await tryClient(
        `txn-pooler-${aws}-${region}`,
        transactionPoolerConfig(poolerHost),
      );
      if (c) return c;
    }
  }

  // 5) Last resort: direct db.* (often IPv6-only on Windows)
  const dbHost = `db.${PRODUCTION_REF}.supabase.co`;
  let v6 = [];
  let v4 = [];
  try {
    v6 = await resolve6(dbHost);
  } catch {
    v6 = [];
  }
  try {
    v4 = await resolve4(dbHost);
  } catch {
    v4 = [];
  }
  console.log(`DNS ${dbHost}: A=${v4.length} AAAA=${v6.length}`);

  if (v4[0]) {
    const c = await tryClient("direct-ipv4", {
      host: v4[0],
      port: 5432,
      user: "postgres",
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
    });
    if (c) return c;
  }
  if (v6[0]) {
    const c = await tryClient("direct-ipv6", {
      host: v6[0],
      port: 5432,
      user: "postgres",
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
    });
    if (c) return c;
  }

  console.log("CONNECT: FAIL");
  console.log(
    "HINT: set SUPABASE_POOLER_HOST to the host from Dashboard → Connect → Session pooler (e.g. aws-0-eu-central-1.pooler.supabase.com). Do not paste password.",
  );
  process.exit(4);
}

console.log("---CONNECT_PHASE---");
const client = await connectProduction();
console.log("CONNECT_PHASE: PASS");
console.log("MIGRATION_GATE: open (connection verified)");

// Confirm session identity without printing sensitive material
const dbIdentity = await client.query(`
  select current_database() as db,
         current_user as usr
`);
const connectedUser = dbIdentity.rows[0]?.usr || "";
const connectedDb = dbIdentity.rows[0]?.db || "";
console.log("CONNECTED_DB:", connectedDb === "postgres" ? "postgres" : "OTHER");
console.log(
  "CONNECTED_USER_MATCHES_POOLER:",
  connectedUser === POOLER_USER || connectedUser === "postgres"
    ? "PASS"
    : "WARN",
);
// Never print the raw role string if unexpected — only PASS/WARN above.

// Precheck 0016 baseline
const m16 = await client.query(`
  select
    to_regclass('public.admin_users') is not null as admin_users_exists,
    exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'admin_users'
        and column_name = 'last_login'
    ) as admin_last_login_exists
`);
const adminOk =
  m16.rows[0]?.admin_users_exists === true &&
  m16.rows[0]?.admin_last_login_exists === true;
console.log("PRECHECK_0016_ADMIN_USERS:", adminOk ? "PASS" : "FAIL");
if (!adminOk) {
  await client.end();
  console.log("BLOCKED: production does not look like 0016 baseline is present");
  process.exit(5);
}

let beforeTotal = null;
let beforeStamped = null;
let columnExistedBefore = false;
try {
  const preCol = await client.query(`
    select
      count(*)::int as total,
      count(sessions_invalidated_at)::int as stamped
    from public.profiles
  `);
  columnExistedBefore = true;
  beforeTotal = preCol.rows[0].total;
  beforeStamped = preCol.rows[0].stamped;
} catch {
  const pre = await client.query(
    `select count(*)::int as total from public.profiles`,
  );
  beforeTotal = pre.rows[0].total;
  beforeStamped = 0;
  columnExistedBefore = false;
}
console.log(
  "PROFILES_BEFORE total=",
  beforeTotal,
  "column_existed=",
  columnExistedBefore,
  "stamped=",
  beforeStamped,
);

const sqlPath = resolve(
  process.cwd(),
  "supabase",
  "migrations",
  MIGRATION_FILE,
);
if (!existsSync(sqlPath)) {
  console.log("FAIL: migration file missing");
  await client.end();
  process.exit(1);
}
const sql = readFileSync(sqlPath, "utf8");
if (!sql.includes("sessions_invalidated_at")) {
  console.log("FAIL: migration content unexpected");
  await client.end();
  process.exit(1);
}

console.log("---APPLY_PHASE---");
console.log("APPLY:", MIGRATION_FILE);
await client.query("begin");
try {
  await client.query(sql);
  await client.query("commit");
  console.log("APPLY_RESULT: PASS");
} catch (e) {
  await client.query("rollback");
  console.log("APPLY_RESULT: FAIL");
  console.log("ERROR:", safeError(e));
  await client.end();
  process.exit(1);
}

const col = await client.query(`
  select
    column_name,
    data_type,
    is_nullable
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'sessions_invalidated_at'
`);
const colOk =
  col.rows[0]?.column_name === "sessions_invalidated_at" &&
  col.rows[0]?.data_type === "timestamp with time zone" &&
  col.rows[0]?.is_nullable === "YES";
console.log("SCHEMA_COLUMN:", colOk ? "PASS" : "FAIL");

const idx = await client.query(`
  select indexname
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'profiles'
    and indexname = 'profiles_sessions_invalidated_at_idx'
`);
const idxOk = idx.rows.length === 1;
console.log("SCHEMA_INDEX:", idxOk ? "PASS" : "FAIL");

const after = await client.query(`
  select
    count(*)::int as total,
    count(sessions_invalidated_at)::int as stamped
  from public.profiles
`);
const afterTotal = after.rows[0].total;
const afterStamped = after.rows[0].stamped;
const preserved = afterTotal === beforeTotal;
const noMassLogout = afterStamped === (columnExistedBefore ? beforeStamped : 0);
console.log("PROFILES_AFTER total=", afterTotal, "stamped=", afterStamped);
console.log("DATA_PRESERVED:", preserved ? "PASS" : "FAIL");
console.log("NO_MASS_STAMP:", noMassLogout ? "PASS" : "FAIL");

const authSmoke = await client.query(`
  select
    to_regclass('public.profiles') is not null as profiles_ok,
    to_regclass('auth.users') is not null as auth_users_ok,
    to_regclass('public.user_sessions') is not null as user_sessions_ok
`);
const authOk =
  authSmoke.rows[0]?.profiles_ok &&
  authSmoke.rows[0]?.auth_users_ok &&
  authSmoke.rows[0]?.user_sessions_ok;
console.log("AUTH_SMOKE:", authOk ? "PASS" : "FAIL");

const adminSmoke = await client.query(`
  select
    to_regclass('public.admin_users') is not null as admin_users_ok,
    exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='admin_users' and column_name='role'
    ) as admin_role_ok
`);
const adminOk2 =
  adminSmoke.rows[0]?.admin_users_ok && adminSmoke.rows[0]?.admin_role_ok;
console.log("ADMIN_SMOKE:", adminOk2 ? "PASS" : "FAIL");

await client.end();

const allOk = colOk && idxOk && preserved && noMassLogout && authOk && adminOk2;
console.log("---PRODUCTION_0017_REPORT---");
console.log("0017:", allOk ? "PASS" : "FAIL");
console.log("sessions_invalidated_at:", colOk ? "PASS" : "FAIL");
console.log("index:", idxOk ? "PASS" : "FAIL");
console.log("existing profiles preserved:", preserved ? "PASS" : "FAIL");
console.log("mass logout:", noMassLogout ? "NO" : "YES");
console.log("unexpected mutation:", preserved && noMassLogout ? "NO" : "YES");
console.log("Auth smoke:", authOk ? "PASS" : "FAIL");
console.log("Admin smoke:", adminOk2 ? "PASS" : "FAIL");
console.log("Production migration applied:", allOk ? "YES" : "PARTIAL/FAIL");
console.log("Vercel deploy: NO");
console.log("Secrets exposed: NO");

if (!allOk) process.exit(1);
