/**
 * Apply supabase/migrations/*.sql to hosted STAGING only (pg driver).
 * Never prints secrets. Refuses production host/ref.
 * Handles IPv6-only db.* hosts.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { resolve4, resolve6 } from "node:dns/promises";
import pg from "pg";

const { Client } = pg;
const PRODUCTION_HOST = "xwxfjzyfrcaxdwvkdedq.supabase.co";
const PRODUCTION_REF = "xwxfjzyfrcaxdwvkdedq";

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

loadEnvFile(".env.staging");
loadEnvFile("env.staging");

const apiUrl = (process.env.STAGING_SUPABASE_URL || "").trim();
if (!apiUrl) {
  console.log("FAIL: STAGING_SUPABASE_URL missing");
  process.exit(1);
}

let host = "";
try {
  host = new URL(apiUrl).hostname.toLowerCase();
} catch {
  console.log("FAIL: invalid STAGING_SUPABASE_URL");
  process.exit(1);
}

if (host === PRODUCTION_HOST) {
  console.log("BLOCKED: production Supabase host");
  process.exit(2);
}

const ref = host.split(".")[0] || "";
if (ref === PRODUCTION_REF) {
  console.log("BLOCKED: production project ref");
  process.exit(2);
}

const password =
  process.env.STAGING_DB_PASSWORD?.trim() ||
  process.env.SUPABASE_DB_PASSWORD?.trim() ||
  "";

function assertNotProduction(value) {
  if (value.includes(PRODUCTION_REF) || value.includes(PRODUCTION_HOST)) {
    console.log("BLOCKED: production identifier detected");
    process.exit(2);
  }
}

async function tryClient(label, config) {
  const client = new Client(config);
  try {
    await client.connect();
    await client.query("select 1 as ok");
    console.log(`CONNECT: PASS via ${label}`);
    return client;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.log(`CONNECT ${label}: FAIL (${msg.slice(0, 160)})`);
    try {
      await client.end();
    } catch {
      // ignore
    }
    return null;
  }
}

async function connectStaging() {
  for (const k of ["STAGING_DATABASE_URL", "STAGING_DB_URL"]) {
    const v = process.env[k]?.trim();
    if (!v) continue;
    assertNotProduction(v);
    console.log(`TRY: ${k}`);
    const client = await tryClient(k, {
      connectionString: v,
      ssl: { rejectUnauthorized: false },
    });
    if (client) return client;
  }

  // Never use production DATABASE_URL from .env.local — only explicit staging keys above.
  if (!password) {
    console.log("BLOCKED: STAGING_DB_PASSWORD missing");
    process.exit(3);
  }

  const dbHost = `db.${ref}.supabase.co`;
  assertNotProduction(dbHost);

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

  for (const ip of v6) {
    const client = await tryClient("direct-ipv6", {
      host: ip,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password,
      ssl: { rejectUnauthorized: false, servername: dbHost },
    });
    if (client) return client;
  }
  for (const ip of v4) {
    const client = await tryClient("direct-ipv4", {
      host: ip,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password,
      ssl: { rejectUnauthorized: false, servername: dbHost },
    });
    if (client) return client;
  }

  {
    const client = await tryClient("direct-hostname", {
      host: dbHost,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password,
      ssl: { rejectUnauthorized: false },
    });
    if (client) return client;
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
  for (const prefix of ["aws-0", "aws-1"]) {
    for (const region of regions) {
      const poolHost = `${prefix}-${region}.pooler.supabase.com`;
      const client = await tryClient(`pooler-${prefix}-${region}`, {
        host: poolHost,
        port: 5432,
        database: "postgres",
        user: `postgres.${ref}`,
        password,
        ssl: { rejectUnauthorized: false },
      });
      if (client) return client;
    }
  }

  return null;
}

console.log("TARGET_REF_LEN:", ref.length);
const client = await connectStaging();
if (!client) {
  console.log("RESULT: FAIL");
  console.log(
    "ERROR: could not open staging Postgres. Add STAGING_DATABASE_URL from Dashboard → Database → URI.",
  );
  process.exit(1);
}

const dir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
console.log("MIGRATION_FILES:", files.length);

try {
  await client.query(`
    create table if not exists public._zynteksis_schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const appliedRes = await client.query(
    `select filename from public._zynteksis_schema_migrations`,
  );
  const applied = new Set(appliedRes.rows.map((r) => r.filename));

  let ran = 0;
  let skipped = 0;
  for (const file of files) {
    if (applied.has(file)) {
      skipped += 1;
      console.log("SKIP:", file);
      continue;
    }
    const body = readFileSync(resolve(dir, file), "utf8");
    console.log("APPLY:", file);
    try {
      await client.query("begin");
      await client.query(body);
      await client.query(
        `insert into public._zynteksis_schema_migrations (filename) values ($1)`,
        [file],
      );
      await client.query("commit");
      ran += 1;
    } catch (e) {
      await client.query("rollback");
      throw e;
    }
  }

  const required = [
    "profiles",
    "workspaces",
    "projects",
    "api_keys",
    "api_key_logs",
    "heartbeats",
    "errors",
    "error_events",
    "performance_logs",
    "admin_users",
  ];
  const tables = await client.query(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'
       and table_name = any($1::text[])
     order by table_name`,
    [required],
  );
  const found = new Set(tables.rows.map((t) => t.table_name));
  const missing = required.filter((t) => !found.has(t));
  console.log("TABLES_OK:", [...found].join(",") || "(none)");
  console.log("TABLES_MISSING:", missing.join(",") || "(none)");
  console.log("APPLIED_NOW:", ran);
  console.log("SKIPPED:", skipped);
  if (missing.length) {
    console.log("RESULT: FAIL");
    process.exit(1);
  }
  console.log("RESULT: PASS");
} catch (e) {
  console.log("RESULT: FAIL");
  console.log(
    "ERROR:",
    e instanceof Error ? e.message.slice(0, 400) : "unknown",
  );
  process.exit(1);
} finally {
  await client.end();
}
