-- ---------------------------------------------------------------------------
-- Migration: incident detection, notification system and public status pages.
-- Depends on 0001 (public.handle_updated_at), 0002 (projects) and 0003.
-- ---------------------------------------------------------------------------

-- Enumerated domains -------------------------------------------------------

create type public.incident_status as enum (
  'investigating',
  'identified',
  'monitoring',
  'resolved'
);

create type public.incident_severity as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type public.incident_source as enum ('monitor', 'manual');

create type public.notification_type as enum (
  'incident_created',
  'incident_resolved',
  'critical_error',
  'api_key_revoked',
  'project_created'
);

create type public.notification_channel as enum (
  'email',
  'dashboard',
  'slack',
  'discord'
);

create type public.notification_delivery_status as enum (
  'pending',
  'processing',
  'sent',
  'failed',
  'skipped'
);

create type public.notification_level as enum (
  'info',
  'success',
  'warning',
  'error'
);

-- Incidents ----------------------------------------------------------------

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  status public.incident_status not null default 'investigating',
  severity public.incident_severity not null default 'high',
  source public.incident_source not null default 'monitor',
  started_at timestamptz not null default now(),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  downtime_seconds integer,
  last_heartbeat_at timestamptz,
  auto_resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.incidents is 'Operational incidents detected by the monitoring engine or created manually.';

create index incidents_project_id_idx on public.incidents (project_id);
create index incidents_user_started_idx
  on public.incidents (user_id, started_at desc);
create index incidents_project_status_idx
  on public.incidents (project_id, status);

-- At most one open, monitor-generated incident per project.
create unique index incidents_one_open_monitor_per_project
  on public.incidents (project_id)
  where status <> 'resolved' and source = 'monitor';

create trigger incidents_set_updated_at
  before update on public.incidents
  for each row
  execute function public.handle_updated_at();

-- Incident updates (timeline) ----------------------------------------------

create table public.incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.incident_status,
  message text not null,
  created_at timestamptz not null default now()
);

comment on table public.incident_updates is 'Chronological updates posted against an incident.';

create index incident_updates_incident_created_idx
  on public.incident_updates (incident_id, created_at);

-- Notification preferences -------------------------------------------------

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email_enabled boolean not null default true,
  dashboard_enabled boolean not null default true,
  slack_enabled boolean not null default false,
  slack_webhook_url text,
  discord_enabled boolean not null default false,
  discord_webhook_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notification_preferences is 'Per-user notification channel preferences.';

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.handle_updated_at();

-- Notification queue (durable outbox) --------------------------------------

create table public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  type public.notification_type not null,
  channel public.notification_channel not null,
  level public.notification_level not null default 'info',
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  status public.notification_delivery_status not null default 'pending',
  attempts integer not null default 0,
  scheduled_for timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notification_queue is 'Outbound notification jobs processed by the notification engine.';

create index notification_queue_status_scheduled_idx
  on public.notification_queue (status, scheduled_for);
create index notification_queue_user_idx on public.notification_queue (user_id);

create trigger notification_queue_set_updated_at
  before update on public.notification_queue
  for each row
  execute function public.handle_updated_at();

-- Notification logs (delivery record + in-app feed) ------------------------

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  queue_id uuid references public.notification_queue (id) on delete set null,
  type public.notification_type not null,
  channel public.notification_channel not null,
  level public.notification_level not null default 'info',
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  status public.notification_delivery_status not null default 'sent',
  provider_message_id text,
  error text,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notification_logs is 'Delivered notifications; the dashboard channel doubles as the in-app feed.';

create index notification_logs_user_created_idx
  on public.notification_logs (user_id, created_at desc);
create index notification_logs_user_channel_idx
  on public.notification_logs (user_id, channel);
create index notification_logs_dedupe_idx
  on public.notification_logs (user_id, type, project_id, created_at desc);

-- Status pages -------------------------------------------------------------

create table public.status_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.status_pages is 'Public status page configuration for a project.';

create index status_pages_user_idx on public.status_pages (user_id);

create trigger status_pages_set_updated_at
  before update on public.status_pages
  for each row
  execute function public.handle_updated_at();

-- Status page components ---------------------------------------------------

create table public.status_page_components (
  id uuid primary key default gen_random_uuid(),
  status_page_id uuid not null references public.status_pages (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.status_page_components is 'Individual components listed on a status page.';

create index status_page_components_page_idx
  on public.status_page_components (status_page_id, position);

create trigger status_page_components_set_updated_at
  before update on public.status_page_components
  for each row
  execute function public.handle_updated_at();

-- Row Level Security -------------------------------------------------------

alter table public.incidents enable row level security;
alter table public.incident_updates enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_queue enable row level security;
alter table public.notification_logs enable row level security;
alter table public.status_pages enable row level security;
alter table public.status_page_components enable row level security;

-- Incidents: owner may read and manage their own incidents. Monitor-created
-- rows are written by the service role (bypasses RLS).
create policy "Incidents are viewable by the owner"
  on public.incidents for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Incidents are insertable by the owner"
  on public.incidents for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Incidents are updatable by the owner"
  on public.incidents for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Incident updates are viewable by the owner"
  on public.incident_updates for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Incident updates are insertable by the owner"
  on public.incident_updates for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Notification preferences are viewable by the owner"
  on public.notification_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Notification preferences are insertable by the owner"
  on public.notification_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Notification preferences are updatable by the owner"
  on public.notification_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Notification queue is service-role only (no authenticated policies).

create policy "Notification logs are viewable by the owner"
  on public.notification_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Notification logs are updatable by the owner"
  on public.notification_logs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Notification logs are deletable by the owner"
  on public.notification_logs for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Status pages are manageable by the owner"
  on public.status_pages for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Public status pages are viewable by anyone"
  on public.status_pages for select to anon, authenticated
  using (is_public);

create policy "Status page components are manageable by the owner"
  on public.status_page_components for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Public status page components are viewable by anyone"
  on public.status_page_components for select to anon, authenticated
  using (
    exists (
      select 1 from public.status_pages sp
      where sp.id = status_page_id and sp.is_public
    )
  );
