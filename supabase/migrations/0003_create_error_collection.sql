-- ---------------------------------------------------------------------------
-- Migration: error collection tables for the ZYNTEKSIS SDK ingestion pipeline.
-- Depends on 0001 (public.handle_updated_at) and 0002 (projects,
-- public.api_key_environment).
-- ---------------------------------------------------------------------------

-- Enumerated domains -------------------------------------------------------

create type public.event_level as enum (
  'debug',
  'info',
  'warning',
  'error',
  'fatal'
);

-- Errors (deduplicated groups) ---------------------------------------------
-- One row per unique fingerprint (message + stack + url). Repeated
-- occurrences within the dedup window increment `occurrences` instead of
-- inserting new rows.

create table public.errors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  fingerprint text not null,
  message text not null,
  stack text,
  type text,
  level public.event_level not null default 'error',
  url text,
  browser jsonb,
  os jsonb,
  device jsonb,
  screen jsonb,
  language text,
  timezone text,
  environment public.api_key_environment not null default 'production',
  release text,
  performance jsonb,
  network jsonb,
  memory jsonb,
  occurrences integer not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.errors is 'Deduplicated error groups captured by the ZYNTEKSIS SDK.';

create index errors_project_id_idx on public.errors (project_id);
create index errors_project_fingerprint_idx
  on public.errors (project_id, fingerprint);
create index errors_project_last_seen_idx
  on public.errors (project_id, last_seen desc);

create trigger errors_set_updated_at
  before update on public.errors
  for each row
  execute function public.handle_updated_at();

-- Error events (generic SDK event stream) ----------------------------------

create table public.error_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  name text,
  level public.event_level not null default 'info',
  message text,
  url text,
  metadata jsonb not null default '{}'::jsonb,
  environment public.api_key_environment not null default 'production',
  release text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.error_events is 'Generic event stream (breadcrumbs, custom events) from the SDK.';

create index error_events_project_created_idx
  on public.error_events (project_id, created_at desc);

-- Heartbeats ----------------------------------------------------------------

create table public.heartbeats (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  memory jsonb,
  uptime double precision,
  page text,
  environment public.api_key_environment not null default 'production',
  release text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.heartbeats is 'Periodic liveness beacons emitted by the SDK.';

create index heartbeats_project_created_idx
  on public.heartbeats (project_id, created_at desc);

-- Performance logs ----------------------------------------------------------

create table public.performance_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  url text,
  page_load double precision,
  fcp double precision,
  lcp double precision,
  cls double precision,
  inp double precision,
  ttfb double precision,
  navigation jsonb,
  environment public.api_key_environment not null default 'production',
  release text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.performance_logs is 'Web performance metrics reported by the SDK.';

create index performance_logs_project_created_idx
  on public.performance_logs (project_id, created_at desc);

-- Row Level Security -------------------------------------------------------
-- Rows are written server-side using the service-role client (which bypasses
-- RLS). Owners may read their own project data.

alter table public.errors enable row level security;
alter table public.error_events enable row level security;
alter table public.heartbeats enable row level security;
alter table public.performance_logs enable row level security;

create policy "Errors are viewable by the owner"
  on public.errors
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Error events are viewable by the owner"
  on public.error_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Heartbeats are viewable by the owner"
  on public.heartbeats
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Performance logs are viewable by the owner"
  on public.performance_logs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
