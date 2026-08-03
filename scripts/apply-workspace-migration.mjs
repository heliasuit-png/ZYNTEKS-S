/**
 * Applies 0006 workspace migration using DATABASE_URL / SUPABASE_DB_URL.
 * Usage:
 *   set DATABASE_URL=postgresql://...
 *   node scripts/apply-workspace-migration.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sqlPath = join(
  root,
  "supabase/migrations/0006_create_workspaces_enterprise.sql",
);

function loadEnvFile() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      const key = line.slice(0, i);
      const value = line.slice(i + 1).replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvFile();

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  console.error(
    "Missing DATABASE_URL (or SUPABASE_DB_URL). Add the Postgres connection string, then re-run.",
  );
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");

  const checks = await client.query(`
    select
      (select count(*)::int from public.workspaces) as workspaces,
      (select count(*)::int from public.workspace_members) as members,
      (select count(*)::int from public.projects) as projects,
      (select count(*)::int from public.projects where workspace_id is null) as null_workspace_ids
  `);
  const row = checks.rows[0];
  if (row.null_workspace_ids > 0) {
    throw new Error(
      `Migration finished but ${row.null_workspace_ids} projects still have NULL workspace_id`,
    );
  }
  console.log(
    `OK: applied migration. workspaces=${row.workspaces} members=${row.members} projects=${row.projects} null_workspace_ids=0`,
  );
} catch (error) {
  await client.query("rollback");
  console.error("FAIL:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
