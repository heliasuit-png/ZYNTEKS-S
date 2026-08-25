/**
 * Applies 0016_admin_users_lock_privileged_columns.sql to the target DB.
 * Usage:
 *   $env:DATABASE_URL="postgresql://..."
 *   node scripts/apply-0016-admin-users-lock.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sqlPath = join(
  root,
  "supabase/migrations/0016_admin_users_lock_privileged_columns.sql",
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

  const privileges = await client.query(`
    select
      grantee,
      privilege_type,
      is_grantable,
      coalesce(string_agg(column_name, ',' order by column_name), '*') as columns
    from (
      select
        grantee::text,
        privilege_type,
        is_grantable,
        null::text as column_name
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'admin_users'
        and grantee in ('anon', 'authenticated', 'service_role')
        and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
      union all
      select
        grantee::text,
        privilege_type,
        is_grantable,
        column_name::text
      from information_schema.column_privileges
      where table_schema = 'public'
        and table_name = 'admin_users'
        and grantee in ('anon', 'authenticated', 'service_role')
        and privilege_type = 'UPDATE'
    ) t
    group by grantee, privilege_type, is_grantable
    order by grantee, privilege_type, columns
  `);

  console.log("OK: applied 0016_admin_users_lock_privileged_columns.sql");
  for (const row of privileges.rows) {
    console.log(
      `grant ${row.privilege_type} (${row.columns}) -> ${row.grantee}`,
    );
  }

  const updateTable = await client.query(`
    select grantee
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'admin_users'
      and privilege_type = 'UPDATE'
      and grantee in ('anon', 'authenticated')
  `);
  if (updateTable.rowCount > 0) {
    throw new Error(
      `Unexpected table-level UPDATE still granted to: ${updateTable.rows
        .map((r) => r.grantee)
        .join(", ")}`,
    );
  }

  const lastLogin = await client.query(`
    select 1
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name = 'admin_users'
      and column_name = 'last_login'
      and privilege_type = 'UPDATE'
      and grantee = 'authenticated'
  `);
  if (lastLogin.rowCount === 0) {
    throw new Error("authenticated lacks UPDATE (last_login)");
  }

  const serviceDml = await client.query(`
    select privilege_type
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'admin_users'
      and grantee = 'service_role'
      and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  `);
  const have = new Set(serviceDml.rows.map((r) => r.privilege_type));
  for (const needed of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
    if (!have.has(needed)) {
      throw new Error(`service_role missing ${needed} on admin_users`);
    }
  }

  console.log("VERIFY_GRANTS: pass");
} catch (error) {
  try {
    await client.query("rollback");
  } catch {
    // ignore
  }
  console.error("FAIL:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
