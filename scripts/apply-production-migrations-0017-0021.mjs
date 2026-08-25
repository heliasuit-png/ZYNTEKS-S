/**
 * Apply production non-payment migrations in order:
 *   0017 → 0019 → 0020 → 0021
 * SKIP: 0018 (Lemon/payment only)
 *
 * Guards: production host only, CONNECT PASS required, stop on first FAIL.
 * Never prints secrets. No Vercel deploy. No payment mutation.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolve4, resolve6 } from "node:dns/promises";
import pg from "pg";

const { Client } = pg;

const PRODUCTION_HOST = "xwxfjzyfrcaxdwvkdedq.supabase.co";
const PRODUCTION_REF = "xwxfjzyfrcaxdwvkdedq";
const STAGING_HOST = "qwylzdzsqjjqdkomezvg.supabase.co";
const STAGING_REF = "qwylzdzsqjjqdkomezvg";
const POOLER_USER = `postgres.${PRODUCTION_REF}`;
const SESSION_PORT = 5432;
const TRANSACTION_PORT = 6543;

const APPLY_FILES = [
  "0017_sessions_invalidated_at.sql",
  "0019_security_hardening.sql",
  "0020_workspace_telemetry_isolation.sql",
  "0021_owner_guard_ai_quota.sql",
];
const SKIP_PAYMENT = "0018_billing_lemon_squeezy.sql";

const report = {
  "0017": "BLOCKED",
  "0018": "SKIPPED — PAYMENT ONLY",
  "0019": "BLOCKED",
  "0020": "BLOCKED",
  "0021": "BLOCKED",
  SCHEMA_VERIFICATION: "BLOCKED",
  DATA_PRESERVED: "BLOCKED",
  UNEXPECTED_MUTATION: "NO",
};

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

let password = "";

function safeError(err) {
  let msg = err instanceof Error ? err.message : String(err);
  msg = msg.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "postgresql://REDACTED");
  if (password) {
    const esc = password.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    msg = msg.replace(new RegExp(esc, "g"), "[REDACTED]");
  }
  return msg.slice(0, 240);
}

function failStop(reason) {
  console.log("STOP:", reason);
  console.log("---PRODUCTION_MIGRATION_REPORT---");
  console.log("TARGET:", report.TARGET || "FAIL");
  console.log("CONNECT:", report.CONNECT || "FAIL");
  console.log("0017:", report["0017"]);
  console.log("0018:", report["0018"]);
  console.log("0019:", report["0019"]);
  console.log("0020:", report["0020"]);
  console.log("0021:", report["0021"]);
  console.log("SCHEMA VERIFICATION:", report.SCHEMA_VERIFICATION);
  console.log("DATA PRESERVED:", report.DATA_PRESERVED);
  console.log("UNEXPECTED MUTATION:", report.UNEXPECTED_MUTATION);
  console.log("PAYMENT: NOT TOUCHED");
  console.log("VERCEL DEPLOY: NO");
  console.log("SECRETS EXPOSED: NO");
  console.log("FINAL: BLOCKED");
  process.exit(1);
}

// --- PHASE 0 ---
const publicUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const publicHost = hostOf(publicUrl);
console.log("TARGET_CHECK NEXT_PUBLIC_SUPABASE_HOST:", publicHost || "UNSET");
console.log("TARGET_CHECK IS_PRODUCTION_HOST:", publicHost === PRODUCTION_HOST);
console.log("TARGET_CHECK IS_STAGING_HOST:", publicHost === STAGING_HOST);

if (publicHost === STAGING_HOST || publicHost.includes(STAGING_REF)) {
  report.TARGET = "FAIL";
  failStop("staging host — refusing production migration");
}
if (publicHost !== PRODUCTION_HOST) {
  report.TARGET = "FAIL";
  failStop("NEXT_PUBLIC_SUPABASE_URL is not production host");
}
report.TARGET = "Production PASS";
console.log("TARGET: Production PASS");

password =
  process.env.SUPABASE_DB_PASSWORD?.trim() ||
  process.env.DB_PASSWORD?.trim() ||
  process.env.POSTGRES_PASSWORD?.trim() ||
  "";

console.log("SUPABASE_DB_PASSWORD:", password ? "SET" : "UNSET");
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.SUPABASE_DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim()
    ? "SET"
    : "UNSET",
);
console.log(
  "SUPABASE_POOLER_HOST:",
  process.env.SUPABASE_POOLER_HOST?.trim() ||
    process.env.PRODUCTION_POOLER_HOST?.trim()
    ? "SET"
    : "UNSET",
);

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
    failStop(`${label} points at staging`);
  }
  if (
    !lower.includes(PRODUCTION_REF) &&
    !lower.includes(PRODUCTION_HOST) &&
    !lower.includes(`db.${PRODUCTION_REF}`)
  ) {
    failStop(`${label} does not clearly identify production ref/host`);
  }
}

function assertProductionPoolerHost(host) {
  const h = host.toLowerCase();
  if (h.includes(STAGING_REF) || h.includes(STAGING_HOST)) {
    failStop("pooler host points at staging");
  }
  if (!h.endsWith(".pooler.supabase.com")) {
    failStop("pooler host must be *.pooler.supabase.com");
  }
}

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
    failStop("production DB password / DATABASE_URL missing");
  }

  const explicitPooler =
    process.env.SUPABASE_POOLER_HOST?.trim() ||
    process.env.PRODUCTION_POOLER_HOST?.trim() ||
    "";
  if (explicitPooler) {
    assertProductionPoolerHost(explicitPooler);
    console.log("TRY: explicit session pooler host (SET)");
    const c = await tryClient(
      "session-pooler-explicit",
      sessionPoolerConfig(explicitPooler),
    );
    if (c) return c;
  }

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

  console.log("TRY: Shared Pooler Session mode");
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

  console.log("TRY: Shared Pooler Transaction mode fallback");
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

  return null;
}

console.log("---CONNECT_PHASE---");
const client = await connectProduction();
if (!client) {
  report.CONNECT = "FAIL";
  failStop("CONNECT FAIL — no migration applied");
}
report.CONNECT = "PASS";
console.log("CONNECT_PHASE: PASS");

const dbIdentity = await client.query(`
  select current_database() as db, current_user as usr
`);
const connectedUser = dbIdentity.rows[0]?.usr || "";
const connectedDb = dbIdentity.rows[0]?.db || "";
console.log("CONNECTED_DB:", connectedDb === "postgres" ? "postgres" : "OTHER");
console.log(
  "CONNECTED_USER_OK:",
  connectedUser === POOLER_USER || connectedUser === "postgres" ? "PASS" : "WARN",
);

await client.query(`
  create table if not exists public._zynteksis_schema_migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  );
`);

const hist = await client.query(
  `select filename from public._zynteksis_schema_migrations order by filename`,
);
const applied = new Set(hist.rows.map((r) => r.filename));
console.log(
  "MIGRATION_HISTORY_PRESENT:",
  APPLY_FILES.map((f) => `${f}=${applied.has(f) ? "YES" : "NO"}`).join(" "),
);
console.log(
  "PAYMENT_0018_IN_HISTORY:",
  applied.has(SKIP_PAYMENT) ? "YES (unexpected)" : "NO",
);

// Baseline counts for data preservation
const countsBefore = await client.query(`
  select
    (select count(*)::int from public.profiles) as profiles,
    (select count(*)::int from public.workspaces) as workspaces,
    (select count(*)::int from public.projects) as projects,
    (select count(*)::int from public.api_keys) as api_keys
`);
const before = countsBefore.rows[0];
console.log(
  "COUNTS_BEFORE profiles=",
  before.profiles,
  "workspaces=",
  before.workspaces,
  "projects=",
  before.projects,
  "api_keys=",
  before.api_keys,
);

async function isApplied(filename) {
  if (applied.has(filename)) return true;
  // Schema-level detection if history missing but SQL already live
  if (filename.startsWith("0017")) {
    const r = await client.query(`
      select exists (
        select 1 from information_schema.columns
        where table_schema='public' and table_name='profiles'
          and column_name='sessions_invalidated_at'
      ) as ok
    `);
    return r.rows[0]?.ok === true;
  }
  if (filename.startsWith("0019")) {
    const r = await client.query(`
      select to_regprocedure('public.accept_workspace_invitation(text)') is not null as ok
    `);
    return r.rows[0]?.ok === true;
  }
  if (filename.startsWith("0020")) {
    const r = await client.query(`
      select to_regprocedure('public.user_can_view_project(uuid)') is not null as ok
    `);
    return r.rows[0]?.ok === true;
  }
  if (filename.startsWith("0021")) {
    const r = await client.query(`
      select
        to_regprocedure('public.ai_record_usage_atomic(uuid,integer,uuid,uuid,text,integer,integer,integer)') is not null
        and to_regprocedure('public.ai_usage_within_limit(uuid,integer)') is not null
        and exists (
          select 1 from pg_trigger t
          join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'workspaces'
            and t.tgname = 'workspaces_guard_owner_id' and not t.tgisinternal
        ) as ok
    `);
    return r.rows[0]?.ok === true;
  }
  return false;
}

async function recordApplied(filename) {
  await client.query(
    `insert into public._zynteksis_schema_migrations (filename)
     values ($1) on conflict (filename) do nothing`,
    [filename],
  );
  applied.add(filename);
}

async function applyMigration(filename) {
  const sqlPath = resolve(process.cwd(), "supabase", "migrations", filename);
  if (!existsSync(sqlPath)) {
    throw new Error(`migration file missing: ${filename}`);
  }
  if (filename === SKIP_PAYMENT || filename.includes("0018")) {
    throw new Error("refusing to apply payment migration 0018");
  }
  const sql = readFileSync(sqlPath, "utf8");
  if (/lemon|billing_lemon/i.test(filename)) {
    throw new Error("refusing lemon/payment filename");
  }
  console.log("APPLY:", filename);
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query(
      `insert into public._zynteksis_schema_migrations (filename)
       values ($1) on conflict (filename) do nothing`,
      [filename],
    );
    await client.query("commit");
    applied.add(filename);
    console.log("APPLY_RESULT: PASS");
  } catch (e) {
    await client.query("rollback");
    console.log("APPLY_RESULT: FAIL");
    console.log("ERROR:", safeError(e));
    throw e;
  }
}

// --- PHASE 2: 0017 ---
console.log("---PHASE 0017---");
try {
  const already = await isApplied("0017_sessions_invalidated_at.sql");
  if (already) {
    console.log("0017: already present — SKIP re-apply");
    await recordApplied("0017_sessions_invalidated_at.sql");
  } else {
    await applyMigration("0017_sessions_invalidated_at.sql");
  }

  const col = await client.query(`
    select data_type, is_nullable
    from information_schema.columns
    where table_schema='public' and table_name='profiles'
      and column_name='sessions_invalidated_at'
  `);
  const colOk =
    col.rows[0]?.data_type === "timestamp with time zone" &&
    col.rows[0]?.is_nullable === "YES";
  console.log("SCHEMA_COLUMN:", colOk ? "PASS" : "FAIL");

  const idx = await client.query(`
    select 1 from pg_indexes
    where schemaname='public' and tablename='profiles'
      and indexname='profiles_sessions_invalidated_at_idx'
  `);
  const idxOk = idx.rows.length === 1;
  console.log("SCHEMA_INDEX:", idxOk ? "PASS" : "FAIL");

  const afterProfiles = await client.query(
    `select count(*)::int as total from public.profiles`,
  );
  const dataOk = afterProfiles.rows[0].total === before.profiles;
  console.log("DATA_PRESERVED:", dataOk ? "PASS" : "FAIL");

  if (!colOk || !idxOk || !dataOk) {
    report["0017"] = "FAIL";
    report.DATA_PRESERVED = dataOk ? "PASS" : "FAIL";
    failStop("0017 verification failed");
  }
  report["0017"] = "PASS";
  console.log("0017: PASS");
} catch (e) {
  report["0017"] = "FAIL";
  console.log("ERROR:", safeError(e));
  await client.end();
  failStop("0017 apply/verify failed");
}

// --- PHASE 3: 0019 ---
console.log("---PHASE 0019---");
try {
  const already = await isApplied("0019_security_hardening.sql");
  if (already) {
    console.log("0019: already present — SKIP re-apply");
    await recordApplied("0019_security_hardening.sql");
  } else {
    await applyMigration("0019_security_hardening.sql");
  }

  const rpc = await client.query(`
    select to_regprocedure('public.accept_workspace_invitation(text)') is not null as ok
  `);
  const inviteOk = rpc.rows[0]?.ok === true;
  console.log("INVITATION_RPC:", inviteOk ? "PASS" : "FAIL");

  const manage = await client.query(`
    select to_regprocedure('public.user_can_manage_project(uuid)') is not null as ok
  `);
  const manageOk = manage.rows[0]?.ok === true;
  console.log("API_KEY_BINDING_HELPER:", manageOk ? "PASS" : "FAIL");

  const guard = await client.query(`
    select to_regprocedure('public.workspace_members_guard_privileged_update()') is not null as ok
  `);
  const memberOk = guard.rows[0]?.ok === true;
  console.log("MEMBER_POLICY:", memberOk ? "PASS" : "FAIL");

  const priv = await client.query(`
    select
      has_table_privilege('authenticated', 'public.profiles', 'UPDATE') as can_update,
      (
        select count(*)::int
        from information_schema.column_privileges
        where grantee = 'authenticated'
          and table_schema = 'public'
          and table_name = 'profiles'
          and column_name in ('role', 'subscription_plan', 'status')
          and privilege_type = 'UPDATE'
      ) as privileged_update_grants
  `);
  // authenticated may have UPDATE on table but not on privileged columns via column grants
  const privilegeLock =
    Number(priv.rows[0]?.privileged_update_grants || 0) === 0;
  console.log("PROFILE_PRIVILEGE_LOCK:", privilegeLock ? "PASS" : "FAIL");

  if (!inviteOk || !manageOk || !memberOk || !privilegeLock) {
    report["0019"] = "FAIL";
    failStop("0019 verification failed");
  }
  report["0019"] = "PASS";
  console.log("0019: PASS");
  console.log("API_KEY_BINDING: PASS");
} catch (e) {
  report["0019"] = "FAIL";
  console.log("ERROR:", safeError(e));
  await client.end();
  failStop("0019 apply/verify failed");
}

// --- PHASE 4: 0020 ---
console.log("---PHASE 0020---");
try {
  const already = await isApplied("0020_workspace_telemetry_isolation.sql");
  if (already) {
    console.log("0020: already present — SKIP re-apply");
    await recordApplied("0020_workspace_telemetry_isolation.sql");
  } else {
    await applyMigration("0020_workspace_telemetry_isolation.sql");
  }

  const viewFn = await client.query(`
    select to_regprocedure('public.user_can_view_project(uuid)') is not null as ok
  `);
  const viewOk = viewFn.rows[0]?.ok === true;
  console.log("WORKSPACE_RLS:", viewOk ? "PASS" : "FAIL");

  const policies = await client.query(`
    select tablename, policyname, cmd
    from pg_policies
    where schemaname = 'public'
      and tablename in ('errors','heartbeats','performance_logs','api_keys','incidents')
      and cmd = 'SELECT'
      and (
        qual ilike '%user_can_view_project%'
        or with_check ilike '%user_can_view_project%'
      )
  `);
  const tables = new Set(policies.rows.map((r) => r.tablename));
  const telemetryOk =
    tables.has("errors") &&
    tables.has("heartbeats") &&
    tables.has("performance_logs");
  const keysOk = tables.has("api_keys");
  const incidentsOk = tables.has("incidents");
  console.log("TELEMETRY_ISOLATION:", telemetryOk ? "PASS" : "FAIL");
  console.log("API_KEY_SELECT:", keysOk ? "PASS" : "FAIL");
  console.log("INCIDENT_SELECT:", incidentsOk ? "PASS" : "FAIL");
  console.log(
    "CROSS_WORKSPACE_PROTECTION:",
    viewOk && telemetryOk ? "PASS" : "FAIL",
  );

  if (!viewOk || !telemetryOk || !keysOk || !incidentsOk) {
    report["0020"] = "FAIL";
    failStop("0020 verification failed");
  }
  report["0020"] = "PASS";
  console.log("0020: PASS");
} catch (e) {
  report["0020"] = "FAIL";
  console.log("ERROR:", safeError(e));
  await client.end();
  failStop("0020 apply/verify failed");
}

// --- PHASE 5: 0021 ---
console.log("---PHASE 0021---");
try {
  const already = await isApplied("0021_owner_guard_ai_quota.sql");
  if (already) {
    console.log("0021: already present — SKIP re-apply");
    await recordApplied("0021_owner_guard_ai_quota.sql");
  } else {
    await applyMigration("0021_owner_guard_ai_quota.sql");
  }

  const owner = await client.query(`
    select exists (
      select 1 from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'workspaces'
        and t.tgname = 'workspaces_guard_owner_id' and not t.tgisinternal
    ) as ok
  `);
  const ownerOk = owner.rows[0]?.ok === true;
  console.log("OWNER_GUARD:", ownerOk ? "PASS" : "FAIL");

  const aiRec = await client.query(`
    select to_regprocedure(
      'public.ai_record_usage_atomic(uuid,integer,uuid,uuid,text,integer,integer,integer)'
    ) is not null as ok
  `);
  const aiRecOk = aiRec.rows[0]?.ok === true;
  console.log("AI_USAGE_RPC:", aiRecOk ? "PASS" : "FAIL");

  const aiQuota = await client.query(`
    select to_regprocedure('public.ai_usage_within_limit(uuid,integer)') is not null as ok
  `);
  const aiQuotaOk = aiQuota.rows[0]?.ok === true;
  console.log("AI_QUOTA_RPC:", aiQuotaOk ? "PASS" : "FAIL");

  if (!ownerOk || !aiRecOk || !aiQuotaOk) {
    report["0021"] = "FAIL";
    failStop("0021 verification failed");
  }
  report["0021"] = "PASS";
  console.log("0021: PASS");
} catch (e) {
  report["0021"] = "FAIL";
  console.log("ERROR:", safeError(e));
  await client.end();
  failStop("0021 apply/verify failed");
}

// --- PHASE 6 final schema ---
console.log("---FINAL_SCHEMA---");
const finalHist = await client.query(
  `select filename from public._zynteksis_schema_migrations`,
);
const finalSet = new Set(finalHist.rows.map((r) => r.filename));

const lemonTables = await client.query(`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
    and table_name in (
      'billing_customers',
      'billing_subscriptions',
      'billing_webhook_events'
    )
`);
const payment0018InHistory = finalSet.has(SKIP_PAYMENT);
const payment0018SchemaPresent = lemonTables.rows.length > 0;
// We never apply 0018 in this script. Pre-existing billing schema is reported
// only — it must not block non-payment migrations 0017/0019/0020/0021.
console.log(
  "0017_APPLIED:",
  finalSet.has("0017_sessions_invalidated_at.sql") || report["0017"] === "PASS"
    ? "YES"
    : "NO",
);
console.log("0019_APPLIED:", report["0019"] === "PASS" ? "YES" : "NO");
console.log("0020_APPLIED:", report["0020"] === "PASS" ? "YES" : "NO");
console.log("0021_APPLIED:", report["0021"] === "PASS" ? "YES" : "NO");
console.log(
  "0018_IN_HISTORY:",
  payment0018InHistory ? "YES" : "NO",
);
console.log(
  "0018_BILLING_SCHEMA_PRESENT:",
  payment0018SchemaPresent ? "YES (pre-existing; not applied this run)" : "NO",
);
console.log("0018:", "SKIPPED — PAYMENT ONLY");

const countsAfter = await client.query(`
  select
    (select count(*)::int from public.profiles) as profiles,
    (select count(*)::int from public.workspaces) as workspaces,
    (select count(*)::int from public.projects) as projects,
    (select count(*)::int from public.api_keys) as api_keys
`);
const after = countsAfter.rows[0];
const preserved =
  after.profiles === before.profiles &&
  after.workspaces === before.workspaces &&
  after.projects === before.projects &&
  after.api_keys === before.api_keys;
report.DATA_PRESERVED = preserved ? "PASS" : "FAIL";
report.UNEXPECTED_MUTATION = preserved ? "NO" : "YES";
console.log(
  "COUNTS_AFTER profiles=",
  after.profiles,
  "workspaces=",
  after.workspaces,
  "projects=",
  after.projects,
  "api_keys=",
  after.api_keys,
);

const schemaOk =
  report["0017"] === "PASS" &&
  report["0019"] === "PASS" &&
  report["0020"] === "PASS" &&
  report["0021"] === "PASS" &&
  !payment0018InHistory &&
  preserved;

report.SCHEMA_VERIFICATION = schemaOk ? "PASS" : "FAIL";

await client.end();

console.log("---PRODUCTION_MIGRATION_REPORT---");
console.log("TARGET:", report.TARGET);
console.log("CONNECT:", report.CONNECT);
console.log("0017:", report["0017"]);
console.log("0018:", report["0018"]);
console.log("0019:", report["0019"]);
console.log("0020:", report["0020"]);
console.log("0021:", report["0021"]);
console.log("SCHEMA VERIFICATION:", report.SCHEMA_VERIFICATION);
console.log("DATA PRESERVED:", report.DATA_PRESERVED);
console.log("UNEXPECTED MUTATION:", report.UNEXPECTED_MUTATION);
console.log("PAYMENT: NOT TOUCHED");
console.log("VERCEL DEPLOY: NO");
console.log("SECRETS EXPOSED: NO");
console.log(
  "FINAL:",
  schemaOk ? "READY_FOR_APP_DEPLOY" : "BLOCKED",
);

if (!schemaOk) process.exit(1);
