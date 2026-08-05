-- ---------------------------------------------------------------------------
-- Migration: Authentication v2 — login events, last login, MFA/WebAuthn ready
-- Depends on: 0001_create_profiles.sql, 0006_create_workspaces_enterprise.sql,
--             0011_create_admin_audit_logs.sql
-- ---------------------------------------------------------------------------

-- Last successful login stamp on profiles (derived from Auth sessions / events)
alter table public.profiles
  add column if not exists last_login_at timestamptz;

alter table public.profiles
  add column if not exists mfa_enabled boolean not null default false;

comment on column public.profiles.last_login_at is
  'Timestamp of the most recent successful product authentication.';
comment on column public.profiles.mfa_enabled is
  'Cached MFA enrollment flag for UI; Supabase Auth factors remain source of truth.';

do $$ begin
  create type public.auth_login_method as enum (
    'password',
    'magic_link',
    'oauth_google',
    'oauth_github',
    'oauth_microsoft',
    'oauth_apple',
    'recovery',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.auth_login_result as enum (
    'success',
    'failure',
    'suspicious'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.auth_login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text,
  method public.auth_login_method not null default 'unknown',
  result public.auth_login_result not null default 'success',
  provider text,
  device_label text,
  browser text,
  os text,
  ip_address text,
  country text,
  user_agent text,
  is_suspicious boolean not null default false,
  suspicion_reasons text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.auth_login_events is
  'Product authentication history for security analytics. Uses Supabase Auth identities only.';

create index if not exists auth_login_events_user_id_created_at_idx
  on public.auth_login_events (user_id, created_at desc);

create index if not exists auth_login_events_created_at_idx
  on public.auth_login_events (created_at desc);

create index if not exists auth_login_events_suspicious_idx
  on public.auth_login_events (is_suspicious)
  where is_suspicious = true;

alter table public.auth_login_events enable row level security;

drop policy if exists "Users can select own login events" on public.auth_login_events;
create policy "Users can select own login events"
  on public.auth_login_events
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Platform admins can select login events" on public.auth_login_events;
create policy "Platform admins can select login events"
  on public.auth_login_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
    )
  );

-- Inserts use the service-role client only.

-- WebAuthn / passkeys architecture placeholder (no runtime enrollment yet).
create table if not exists public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  sign_count bigint not null default 0,
  transports text[] not null default '{}',
  device_type text,
  backed_up boolean not null default false,
  friendly_name text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

comment on table public.webauthn_credentials is
  'Architecture-ready store for WebAuthn/passkey credentials. Enrollment not exposed yet.';

create index if not exists webauthn_credentials_user_id_idx
  on public.webauthn_credentials (user_id);

alter table public.webauthn_credentials enable row level security;

drop policy if exists "Users can select own webauthn credentials" on public.webauthn_credentials;
create policy "Users can select own webauthn credentials"
  on public.webauthn_credentials
  for select
  to authenticated
  using (user_id = (select auth.uid()) and revoked_at is null);

alter type public.admin_audit_action add value if not exists 'auth_login_suspicious';
alter type public.admin_audit_action add value if not exists 'auth_oauth_linked';
