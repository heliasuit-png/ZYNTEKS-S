/**
 * Verifies 0006 workspace migration against a database that already has
 * users + projects (NULL workspace_id), then re-runs for idempotency.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = join(
  root,
  "supabase/migrations/0006_create_workspaces_enterprise.sql",
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function seedBaseline(db) {
  await db.exec(`
    do $$ begin
      create role authenticated;
    exception when duplicate_object then null;
    end $$;

    create schema if not exists auth;

    create table auth.users (
      id uuid primary key,
      email text
    );

    create type public.subscription_plan as enum ('free', 'pro', 'enterprise');
    create type public.user_role as enum ('user', 'admin');
    create type public.user_status as enum ('active', 'inactive', 'banned');
    create type public.project_framework as enum ('other');
    create type public.project_status as enum ('active', 'paused', 'archived');

    create or replace function public.handle_updated_at()
    returns trigger
    language plpgsql
    as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$;

    create or replace function auth.uid()
    returns uuid language sql stable as $$ select null::uuid $$;

    create or replace function auth.jwt()
    returns jsonb language sql stable as $$ select '{}'::jsonb $$;

    create table public.profiles (
      id uuid primary key references auth.users (id) on delete cascade,
      email text not null,
      full_name text,
      avatar_url text,
      subscription_plan public.subscription_plan not null default 'free',
      role public.user_role not null default 'user',
      status public.user_status not null default 'active',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table public.projects (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users (id) on delete cascade,
      name text not null,
      slug text not null,
      description text,
      framework public.project_framework not null default 'other',
      production_url text,
      staging_url text,
      status public.project_status not null default 'active',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint projects_slug_per_user_key unique (user_id, slug)
    );
  `);

  const userA = "11111111-1111-1111-1111-111111111111";
  const userB = "22222222-2222-2222-2222-222222222222";
  const userC = "33333333-3333-3333-3333-333333333333"; // project owner without profile

  await db.exec(`
    insert into auth.users (id, email) values
      ('${userA}', 'alice@example.com'),
      ('${userB}', 'bob@example.com'),
      ('${userC}', 'carol@example.com');

    insert into public.profiles (id, email, full_name, subscription_plan) values
      ('${userA}', 'alice@example.com', 'Alice', 'pro'),
      ('${userB}', 'bob@example.com', null, 'free');

    insert into public.projects (user_id, name, slug) values
      ('${userA}', 'Alice App', 'alice-app'),
      ('${userA}', 'Alice API', 'alice-api'),
      ('${userB}', 'Bob Shop', 'bob-shop'),
      ('${userC}', 'Carol Legacy', 'carol-legacy');
  `);

  return { userA, userB, userC };
}

async function main() {
  const migrationSql = readFileSync(migrationPath, "utf8");
  const db = new PGlite();

  const users = await seedBaseline(db);

  const colBefore = await db.query(`
    select count(*)::int as n
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name = 'workspace_id'
  `);
  assert(colBefore.rows[0].n === 0, "workspace_id should not exist before migration");

  const projectCountBefore = await db.query(
    `select count(*)::int as n from public.projects`,
  );
  assert(projectCountBefore.rows[0].n === 4, "Seed should create 4 projects");

  await db.exec(migrationSql);

  const nulls = await db.query(
    `select count(*)::int as n from public.projects where workspace_id is null`,
  );
  assert(nulls.rows[0].n === 0, `Expected 0 NULL workspace_id, got ${nulls.rows[0].n}`);

  const nullable = await db.query(`
    select is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name = 'workspace_id'
  `);
  assert(nullable.rows[0].is_nullable === "NO", "workspace_id must be NOT NULL");

  const workspaces = await db.query(`select count(*)::int as n from public.workspaces`);
  assert(
    workspaces.rows[0].n >= 3,
    `Expected >= 3 workspaces, got ${workspaces.rows[0].n}`,
  );

  const members = await db.query(
    `select count(*)::int as n from public.workspace_members where role = 'owner'`,
  );
  assert(members.rows[0].n >= 3, `Expected >= 3 owner members, got ${members.rows[0].n}`);

  const projectCount = await db.query(`select count(*)::int as n from public.projects`);
  assert(projectCount.rows[0].n === 4, "Must not delete existing projects");

  const carol = await db.query(
    `
    select w.owner_id::text as owner_id
    from public.projects p
    join public.workspaces w on w.id = p.workspace_id
    where p.slug = 'carol-legacy'
    `,
  );
  assert(
    carol.rows[0]?.owner_id === users.userC,
    "Project without profile must still receive owner workspace",
  );

  // Idempotency: re-run must succeed and keep data intact
  await db.exec(migrationSql);

  const afterRerun = await db.query(`
    select
      (select count(*)::int from public.projects) as projects,
      (select count(*)::int from public.projects where workspace_id is null) as nulls,
      (select count(*)::int from public.workspace_members) as members
  `);
  assert(afterRerun.rows[0].projects === 4, "Idempotent re-run deleted projects");
  assert(afterRerun.rows[0].nulls === 0, "Idempotent re-run left NULL workspace_id");
  assert(afterRerun.rows[0].members >= 3, "Idempotent re-run lost members");

  console.log("OK: workspace migration succeeded on seeded data and is idempotent");
  await db.close();
}

main().catch((error) => {
  console.error("FAIL:", error.message);
  process.exit(1);
});
