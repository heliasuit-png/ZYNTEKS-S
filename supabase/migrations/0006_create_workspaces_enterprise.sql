-- ---------------------------------------------------------------------------
-- Migration: Enterprise Workspace Platform (safe for existing data)
--
-- Order of operations (required for databases that already have projects):
--   1. Create enums + workspaces table
--   2. Add nullable projects.workspace_id
--   3. Create a default personal workspace for every existing user
--   4. Backfill every project.workspace_id
--   5. Enforce NOT NULL only after zero NULLs remain
--   6. Create workspace_members (+ other enterprise tables)
--   7. Create indexes / triggers / helpers
--   8. RLS policies
--
-- Idempotent where possible so a partial prior run can be completed safely.
-- Does NOT delete existing data.
-- ---------------------------------------------------------------------------

-- Enumerated domains (idempotent) ------------------------------------------

do $$ begin
  create type public.workspace_role as enum (
    'owner',
    'administrator',
    'developer',
    'viewer',
    'billing_manager'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.workspace_member_status as enum (
    'active',
    'suspended'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.workspace_invitation_status as enum (
    'pending',
    'accepted',
    'declined',
    'cancelled',
    'expired'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.audit_action as enum (
    'login',
    'logout',
    'project_created',
    'project_updated',
    'project_deleted',
    'api_key_generated',
    'api_key_revoked',
    'incident_closed',
    'ai_analysis',
    'billing_changed',
    'invitation_sent',
    'invitation_accepted',
    'invitation_declined',
    'invitation_cancelled',
    'member_removed',
    'member_suspended',
    'member_restored',
    'role_changed',
    'ownership_transferred',
    'workspace_updated',
    'session_revoked',
    'password_changed',
    'security_updated'
  );
exception when duplicate_object then null;
end $$;

-- 1) Workspaces table ------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  logo_url text,
  owner_id uuid not null references auth.users (id) on delete cascade,
  timezone text not null default 'UTC',
  brand_color text not null default '#00E5FF',
  plan public.subscription_plan not null default 'free',
  notification_defaults jsonb not null default '{"email":true,"dashboard":true}'::jsonb,
  security_policies jsonb not null default '{"require_2fa":false,"session_timeout_hours":720}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.workspaces is
  'Enterprise workspaces (tenants). Projects and membership live under a workspace.';

-- Unique slug (idempotent)
create unique index if not exists workspaces_slug_key on public.workspaces (slug);

-- Add nullable workspace_id to projects BEFORE backfill --------------------

alter table public.projects
  add column if not exists workspace_id uuid;

-- Ensure FK exists (safe if already present)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_workspace_id_fkey'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_workspace_id_fkey
      foreign key (workspace_id)
      references public.workspaces (id)
      on delete cascade;
  end if;
end $$;

-- 2) Default personal workspace for every existing user --------------------
-- Cover auth.users (source of truth), not only profiles, so orphan project
-- owners without a profile row still receive a workspace.

insert into public.workspaces (name, slug, owner_id, plan)
select
  coalesce(
    nullif(trim(p.full_name), ''),
    nullif(split_part(coalesce(p.email, u.email), '@', 1), ''),
    'Personal'
  ) || '''s Workspace',
  'ws-' || replace(u.id::text, '-', ''),
  u.id,
  coalesce(p.subscription_plan, 'free'::public.subscription_plan)
from auth.users u
left join public.profiles p on p.id = u.id
on conflict (slug) do nothing;

-- Also ensure every distinct project owner has a workspace (defensive).
insert into public.workspaces (name, slug, owner_id, plan)
select
  coalesce(
    nullif(trim(p.full_name), ''),
    nullif(split_part(coalesce(p.email, u.email, 'user'), '@', 1), ''),
    'Personal'
  ) || '''s Workspace',
  'ws-' || replace(pr.user_id::text, '-', ''),
  pr.user_id,
  coalesce(p.subscription_plan, 'free'::public.subscription_plan)
from (
  select distinct user_id from public.projects
) pr
join auth.users u on u.id = pr.user_id
left join public.profiles p on p.id = pr.user_id
where not exists (
  select 1 from public.workspaces w where w.owner_id = pr.user_id
)
on conflict (slug) do nothing;

-- 3) Backfill every existing project.workspace_id --------------------------

update public.projects pr
set workspace_id = w.id
from public.workspaces w
where pr.user_id = w.owner_id
  and pr.workspace_id is null;

-- Prefer the earliest owner workspace when a user somehow has multiple.
update public.projects pr
set workspace_id = (
  select w.id
  from public.workspaces w
  where w.owner_id = pr.user_id
  order by w.created_at asc, w.id asc
  limit 1
)
where pr.workspace_id is null;

-- 4) Enforce NOT NULL only after all rows are updated ----------------------

do $$
declare
  orphan_count bigint;
begin
  select count(*) into orphan_count
  from public.projects
  where workspace_id is null;

  if orphan_count > 0 then
    raise exception
      'Cannot set projects.workspace_id NOT NULL: % project(s) still have NULL workspace_id. Backfill incomplete.',
      orphan_count;
  end if;

  -- Only set NOT NULL when the column is still nullable.
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name = 'workspace_id'
      and is_nullable = 'YES'
  ) then
    alter table public.projects
      alter column workspace_id set not null;
  end if;
end $$;

-- 5) Workspace members (+ remaining enterprise tables) ---------------------

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_role not null default 'developer',
  status public.workspace_member_status not null default 'active',
  invited_by uuid references auth.users (id) on delete set null,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_members_workspace_user_key unique (workspace_id, user_id)
);

comment on table public.workspace_members is
  'Membership of users within a workspace with RBAC roles.';

-- Owners as members (idempotent)
insert into public.workspace_members (workspace_id, user_id, role, status)
select w.id, w.owner_id, 'owner'::public.workspace_role, 'active'::public.workspace_member_status
from public.workspaces w
where not exists (
  select 1
  from public.workspace_members wm
  where wm.workspace_id = w.id
    and wm.user_id = w.owner_id
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'developer',
  status public.workspace_invitation_status not null default 'pending',
  token text not null,
  invited_by uuid not null references auth.users (id) on delete cascade,
  accepted_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.workspace_invitations is 'Email invitations to join a workspace.';

create unique index if not exists workspace_invitations_token_key
  on public.workspace_invitations (token);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action public.audit_action not null,
  resource_type text,
  resource_id text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Enterprise audit trail of security and operational actions.';

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_token_hash text not null,
  device_label text,
  browser text,
  os text,
  country text,
  ip_address text,
  user_agent text,
  is_current boolean not null default false,
  last_active_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_sessions_user_token_key unique (user_id, session_token_hash)
);

comment on table public.user_sessions is
  'Tracked browser/device sessions for the Security Center.';

-- 6) Indexes + updated_at triggers -----------------------------------------

create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);
create index if not exists workspaces_created_at_idx on public.workspaces (created_at desc);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members (user_id);
create index if not exists workspace_members_workspace_id_idx
  on public.workspace_members (workspace_id);

create index if not exists workspace_invitations_workspace_idx
  on public.workspace_invitations (workspace_id, status);
create index if not exists workspace_invitations_email_idx
  on public.workspace_invitations (lower(email));
create unique index if not exists workspace_invitations_pending_unique
  on public.workspace_invitations (workspace_id, lower(email))
  where status = 'pending';

create index if not exists audit_logs_workspace_created_idx
  on public.audit_logs (workspace_id, created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);
create index if not exists audit_logs_action_idx on public.audit_logs (action);

create index if not exists user_sessions_user_active_idx
  on public.user_sessions (user_id, last_active_at desc);

create index if not exists projects_workspace_id_idx
  on public.projects (workspace_id);

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row
  execute function public.handle_updated_at();

drop trigger if exists workspace_members_set_updated_at on public.workspace_members;
create trigger workspace_members_set_updated_at
  before update on public.workspace_members
  for each row
  execute function public.handle_updated_at();

drop trigger if exists workspace_invitations_set_updated_at on public.workspace_invitations;
create trigger workspace_invitations_set_updated_at
  before update on public.workspace_invitations
  for each row
  execute function public.handle_updated_at();

-- Helper: active membership ------------------------------------------------

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  );
$$;

create or replace function public.workspace_member_role(p_workspace_id uuid)
returns public.workspace_role
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = p_workspace_id
    and wm.user_id = auth.uid()
    and wm.status = 'active'
  limit 1;
$$;

-- Auto-provision personal workspace on signup (extends profile trigger) ----

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_name text;
  v_slug text;
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  v_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1),
    'Personal'
  ) || '''s Workspace';
  v_slug := 'ws-' || replace(new.id::text, '-', '');

  insert into public.workspaces (name, slug, owner_id)
  values (v_name, v_slug, new.id)
  on conflict (slug) do nothing;

  select id into v_workspace_id
  from public.workspaces
  where owner_id = new.id
  order by created_at asc
  limit 1;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (v_workspace_id, new.id, 'owner', 'active')
  on conflict (workspace_id, user_id) do nothing;

  return new;
end;
$$;

-- 7) Row Level Security ----------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_sessions enable row level security;

-- Workspaces
drop policy if exists "Workspaces are viewable by members" on public.workspaces;
create policy "Workspaces are viewable by members"
  on public.workspaces for select to authenticated
  using (public.is_workspace_member(id) or owner_id = (select auth.uid()));

drop policy if exists "Workspaces are insertable by authenticated users" on public.workspaces;
create policy "Workspaces are insertable by authenticated users"
  on public.workspaces for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Workspaces are updatable by owners and admins" on public.workspaces;
create policy "Workspaces are updatable by owners and admins"
  on public.workspaces for update to authenticated
  using (
    owner_id = (select auth.uid())
    or public.workspace_member_role(id) in ('owner', 'administrator')
  )
  with check (
    owner_id = (select auth.uid())
    or public.workspace_member_role(id) in ('owner', 'administrator')
  );

-- Members
drop policy if exists "Members are viewable by workspace members" on public.workspace_members;
create policy "Members are viewable by workspace members"
  on public.workspace_members for select to authenticated
  using (public.is_workspace_member(workspace_id) or user_id = (select auth.uid()));

drop policy if exists "Members are insertable by owners and admins" on public.workspace_members;
create policy "Members are insertable by owners and admins"
  on public.workspace_members for insert to authenticated
  with check (
    public.workspace_member_role(workspace_id) in ('owner', 'administrator')
    or user_id = (select auth.uid())
  );

drop policy if exists "Members are updatable by owners and admins" on public.workspace_members;
create policy "Members are updatable by owners and admins"
  on public.workspace_members for update to authenticated
  using (
    public.workspace_member_role(workspace_id) in ('owner', 'administrator')
    or user_id = (select auth.uid())
  )
  with check (
    public.workspace_member_role(workspace_id) in ('owner', 'administrator')
    or user_id = (select auth.uid())
  );

drop policy if exists "Members are deletable by owners and admins" on public.workspace_members;
create policy "Members are deletable by owners and admins"
  on public.workspace_members for delete to authenticated
  using (
    public.workspace_member_role(workspace_id) in ('owner', 'administrator')
    or user_id = (select auth.uid())
  );

-- Invitations
drop policy if exists "Invitations are viewable by workspace admins or invitee email"
  on public.workspace_invitations;
create policy "Invitations are viewable by workspace admins or invitee email"
  on public.workspace_invitations for select to authenticated
  using (
    public.is_workspace_member(workspace_id)
    or lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

drop policy if exists "Invitations are insertable by owners and admins"
  on public.workspace_invitations;
create policy "Invitations are insertable by owners and admins"
  on public.workspace_invitations for insert to authenticated
  with check (
    public.workspace_member_role(workspace_id) in ('owner', 'administrator')
  );

drop policy if exists "Invitations are updatable by workspace admins or invitee"
  on public.workspace_invitations;
create policy "Invitations are updatable by workspace admins or invitee"
  on public.workspace_invitations for update to authenticated
  using (
    public.workspace_member_role(workspace_id) in ('owner', 'administrator')
    or lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  )
  with check (
    public.workspace_member_role(workspace_id) in ('owner', 'administrator')
    or lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

-- Audit logs
drop policy if exists "Audit logs are viewable by workspace members" on public.audit_logs;
create policy "Audit logs are viewable by workspace members"
  on public.audit_logs for select to authenticated
  using (
    workspace_id is null and actor_id = (select auth.uid())
    or (workspace_id is not null and public.is_workspace_member(workspace_id))
  );

drop policy if exists "Audit logs are insertable by workspace members" on public.audit_logs;
create policy "Audit logs are insertable by workspace members"
  on public.audit_logs for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and (
      workspace_id is null
      or public.is_workspace_member(workspace_id)
    )
  );

-- Sessions: owner only
drop policy if exists "Sessions are viewable by owner" on public.user_sessions;
create policy "Sessions are viewable by owner"
  on public.user_sessions for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Sessions are insertable by owner" on public.user_sessions;
create policy "Sessions are insertable by owner"
  on public.user_sessions for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Sessions are updatable by owner" on public.user_sessions;
create policy "Sessions are updatable by owner"
  on public.user_sessions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Sessions are deletable by owner" on public.user_sessions;
create policy "Sessions are deletable by owner"
  on public.user_sessions for delete to authenticated
  using (user_id = (select auth.uid()));

-- Expand project RLS so workspace members can access shared projects -------

drop policy if exists "Projects are viewable by the owner" on public.projects;
drop policy if exists "Users can insert their own projects" on public.projects;
drop policy if exists "Users can update their own projects" on public.projects;
drop policy if exists "Users can delete their own projects" on public.projects;
drop policy if exists "Projects are viewable by workspace members" on public.projects;
drop policy if exists "Projects are insertable by workspace members with write roles" on public.projects;
drop policy if exists "Projects are updatable by workspace writers" on public.projects;
drop policy if exists "Projects are deletable by workspace admins" on public.projects;

create policy "Projects are viewable by workspace members"
  on public.projects for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_workspace_member(workspace_id)
  );

create policy "Projects are insertable by workspace members with write roles"
  on public.projects for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      public.workspace_member_role(workspace_id) in (
        'owner', 'administrator', 'developer'
      )
    )
  );

create policy "Projects are updatable by workspace writers"
  on public.projects for update to authenticated
  using (
    public.workspace_member_role(workspace_id) in (
      'owner', 'administrator', 'developer'
    )
  )
  with check (
    public.workspace_member_role(workspace_id) in (
      'owner', 'administrator', 'developer'
    )
  );

create policy "Projects are deletable by workspace admins"
  on public.projects for delete to authenticated
  using (
    public.workspace_member_role(workspace_id) in ('owner', 'administrator')
  );

-- Allow co-members to read profiles of people in shared workspaces ---------

drop policy if exists "Profiles are viewable by workspace co-members" on public.profiles;
create policy "Profiles are viewable by workspace co-members"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.workspace_members me
      join public.workspace_members them
        on them.workspace_id = me.workspace_id
      where me.user_id = (select auth.uid())
        and me.status = 'active'
        and them.user_id = profiles.id
        and them.status in ('active', 'suspended')
    )
  );
