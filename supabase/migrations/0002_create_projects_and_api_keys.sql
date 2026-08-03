-- ---------------------------------------------------------------------------
-- Migration: projects, api_keys and api_key_logs tables with enums, RLS
-- policies and triggers. Depends on 0001 (public.handle_updated_at()).
-- ---------------------------------------------------------------------------

-- Enumerated domains -------------------------------------------------------

create type public.project_framework as enum (
  'nextjs',
  'react',
  'vue',
  'angular',
  'nuxt',
  'express',
  'nodejs',
  'laravel',
  'django',
  'aspnet',
  'flutter_web',
  'other'
);

create type public.project_status as enum ('active', 'paused', 'archived');

create type public.api_key_environment as enum (
  'production',
  'staging',
  'development'
);

create type public.api_key_status as enum ('active', 'revoked');

create type public.api_key_log_event as enum (
  'created',
  'used',
  'revoked',
  'regenerated',
  'auth_success',
  'auth_failed'
);

-- Projects table -----------------------------------------------------------

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

comment on table public.projects is 'Projects owned by a user.';

create index projects_user_id_idx on public.projects (user_id);
create index projects_created_at_idx on public.projects (created_at desc);

create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.handle_updated_at();

-- API keys table -----------------------------------------------------------
-- Only a SHA-256 hash of the key is stored. The plaintext key is shown once
-- at creation and never persisted. `key_prefix` holds the displayable prefix
-- (e.g. ZYN-KEY-ABCD) used to build the masked representation in the UI.

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  environment public.api_key_environment not null default 'development',
  status public.api_key_status not null default 'active',
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint api_keys_key_hash_key unique (key_hash)
);

comment on table public.api_keys is 'Hashed API keys. Plaintext is never stored.';

create index api_keys_project_id_idx on public.api_keys (project_id);
create index api_keys_user_id_idx on public.api_keys (user_id);
create index api_keys_key_hash_idx on public.api_keys (key_hash);

-- API key logs table -------------------------------------------------------
-- Append-only audit trail for API key lifecycle and authentication events.

create table public.api_key_logs (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references public.api_keys (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  event public.api_key_log_event not null,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.api_key_logs is 'Audit log for API key events and authentication attempts.';

create index api_key_logs_api_key_id_idx on public.api_key_logs (api_key_id);
create index api_key_logs_project_id_idx on public.api_key_logs (project_id);
create index api_key_logs_created_at_idx on public.api_key_logs (created_at desc);

-- Row Level Security -------------------------------------------------------

alter table public.projects enable row level security;
alter table public.api_keys enable row level security;
alter table public.api_key_logs enable row level security;

-- Projects: owners have full control over their own rows.

create policy "Projects are viewable by the owner"
  on public.projects
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own projects"
  on public.projects
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own projects"
  on public.projects
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own projects"
  on public.projects
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- API keys: owners can read and manage their own keys. The stored value is a
-- hash, so exposing rows to the owner does not reveal the secret.

create policy "API keys are viewable by the owner"
  on public.api_keys
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own API keys"
  on public.api_keys
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own API keys"
  on public.api_keys
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own API keys"
  on public.api_keys
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- API key logs: owners can read their own logs. Inserts happen server-side
-- (service role for SDK authentication, or the owner for lifecycle events).

create policy "API key logs are viewable by the owner"
  on public.api_key_logs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own API key logs"
  on public.api_key_logs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
