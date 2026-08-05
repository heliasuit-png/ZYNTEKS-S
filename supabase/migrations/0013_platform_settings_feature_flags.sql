-- ---------------------------------------------------------------------------
-- Migration: Platform settings + feature flags for Enterprise Admin Settings.
-- Depends on: 0011_create_admin_audit_logs.sql, 0010_create_admin_users.sql
-- ---------------------------------------------------------------------------

create type public.feature_flag_status as enum (
  'enabled',
  'disabled',
  'beta',
  'internal'
);

create type public.feature_flag_scope as enum (
  'global',
  'workspace',
  'project',
  'user'
);

create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null default '',
  scope public.feature_flag_scope not null default 'global',
  status public.feature_flag_status not null default 'disabled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.feature_flags is
  'Platform feature flags managed from Enterprise Admin Settings.';

create index feature_flags_status_idx on public.feature_flags (status);
create index feature_flags_scope_idx on public.feature_flags (scope);

create trigger feature_flags_set_updated_at
  before update on public.feature_flags
  for each row
  execute function public.handle_updated_at();

alter table public.feature_flags enable row level security;

create policy "Platform admins can select feature flags"
  on public.feature_flags
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
    )
  );

-- Mutations use the service-role client only.

create table public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  platform_name text not null default 'ZYNTEKSIS',
  maintenance_enabled boolean not null default false,
  maintenance_message text,
  registration_enabled boolean not null default true,
  password_min_length integer not null default 8
    check (password_min_length between 6 and 128),
  session_timeout_hours integer not null default 720
    check (session_timeout_hours between 1 and 8760),
  mfa_required boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.platform_settings is
  'Singleton platform configuration for Enterprise Admin Settings. Never stores secrets.';

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row
  execute function public.handle_updated_at();

alter table public.platform_settings enable row level security;

create policy "Platform admins can select platform settings"
  on public.platform_settings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
    )
  );

insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;

insert into public.feature_flags (key, name, description, scope, status)
values
  (
    'ai.assistant',
    'AI Assistant',
    'Enables the product AI assistant for eligible plans.',
    'global',
    'enabled'
  ),
  (
    'billing.checkout',
    'Billing Checkout',
    'Enables plan upgrade / checkout surfaces.',
    'global',
    'beta'
  ),
  (
    'status.public_pages',
    'Public Status Pages',
    'Enables customer-facing status page publishing.',
    'workspace',
    'enabled'
  ),
  (
    'sdk.ingest',
    'SDK Ingest',
    'Accepts SDK telemetry on ingest endpoints.',
    'global',
    'enabled'
  ),
  (
    'admin.experimental',
    'Admin Experimental UI',
    'Internal admin experiments reserved for platform operators.',
    'global',
    'internal'
  )
on conflict (key) do nothing;

alter type public.admin_audit_action add value 'feature_flag_updated';
alter type public.admin_audit_action add value 'platform_settings_updated';

-- Service-role-only metadata helper. Returns public table count; never secrets.
create or replace function public.admin_platform_table_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from information_schema.tables
  where table_schema = 'public'
    and table_type = 'BASE TABLE';
$$;

revoke all on function public.admin_platform_table_count() from public;
grant execute on function public.admin_platform_table_count() to service_role;
