-- ---------------------------------------------------------------------------
-- Migration: Phase A security hardening (RLS + privileged columns + invites)
-- Depends on: 0001, 0002, 0004, 0006, 0016, 0017
--
-- Fixes:
--   1) workspace_members self-join / self-role escalation
--   2) api_keys (and similar) project_id binding on INSERT/UPDATE
--   3) profiles privileged columns (role, subscription_plan, status)
--   4) SECURITY DEFINER accept_workspace_invitation for invite accept path
--
-- Does NOT change Lemon/payment schema. Does NOT mutate existing profile rows.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Helper: caller may manage a project (owner or workspace write role)
-- ---------------------------------------------------------------------------

create or replace function public.user_can_manage_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and (
        p.user_id = auth.uid()
        or public.workspace_member_role(p.workspace_id) in (
          'owner', 'administrator', 'developer'
        )
      )
  );
$$;

revoke all on function public.user_can_manage_project(uuid) from public;
grant execute on function public.user_can_manage_project(uuid) to authenticated;
grant execute on function public.user_can_manage_project(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 1) workspace_members: close self-join; guard privileged self-updates
-- ---------------------------------------------------------------------------

drop policy if exists "Members are insertable by owners and admins"
  on public.workspace_members;
create policy "Members are insertable by owners and admins"
  on public.workspace_members for insert to authenticated
  with check (
    public.workspace_member_role(workspace_id) in ('owner', 'administrator')
  );

-- Keep SELECT / DELETE (leave workspace) policies from 0006.
-- UPDATE: owners/admins manage others; members may only touch own last_active_at
-- (enforced by trigger below).
drop policy if exists "Members are updatable by owners and admins"
  on public.workspace_members;
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

create or replace function public.workspace_members_guard_privileged_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Owners / administrators may change any membership field in their workspace.
  if public.workspace_member_role(coalesce(new.workspace_id, old.workspace_id))
       in ('owner', 'administrator') then
    return new;
  end if;

  -- Non-admins may only update their own last_active_at (activity touch).
  if old.user_id = auth.uid() then
    if new.role is distinct from old.role
       or new.status is distinct from old.status
       or new.workspace_id is distinct from old.workspace_id
       or new.user_id is distinct from old.user_id
       or new.invited_by is distinct from old.invited_by then
      raise exception 'insufficient privilege to update member privileged fields'
        using errcode = '42501';
    end if;
    return new;
  end if;

  raise exception 'insufficient privilege to update workspace member'
    using errcode = '42501';
end;
$$;

drop trigger if exists workspace_members_guard_privileged_update
  on public.workspace_members;
create trigger workspace_members_guard_privileged_update
  before update on public.workspace_members
  for each row
  execute function public.workspace_members_guard_privileged_update();

-- ---------------------------------------------------------------------------
-- Invite accept: SECURITY DEFINER RPC (replaces client INSERT into members)
-- ---------------------------------------------------------------------------

create or replace function public.accept_workspace_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_inv public.workspace_invitations%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email = '' then
    raise exception 'email missing from session' using errcode = '42501';
  end if;

  select *
    into v_inv
  from public.workspace_invitations
  where token = p_token
  for update;

  if not found then
    raise exception 'invitation not found' using errcode = 'P0002';
  end if;

  if v_inv.status <> 'pending' then
    raise exception 'invitation is no longer pending' using errcode = 'P0001';
  end if;

  if v_inv.expires_at < now() then
    update public.workspace_invitations
       set status = 'expired'
     where id = v_inv.id;
    raise exception 'invitation has expired' using errcode = 'P0001';
  end if;

  if lower(v_inv.email) <> v_email then
    raise exception 'invitation email mismatch' using errcode = '42501';
  end if;

  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    status,
    invited_by,
    last_active_at
  )
  values (
    v_inv.workspace_id,
    v_uid,
    v_inv.role,
    'active',
    v_inv.invited_by,
    now()
  )
  on conflict (workspace_id, user_id) do update
    set status = 'active',
        role = excluded.role,
        last_active_at = excluded.last_active_at;

  update public.workspace_invitations
     set status = 'accepted',
         accepted_by = v_uid,
         accepted_at = now()
   where id = v_inv.id;

  return v_inv.id;
end;
$$;

revoke all on function public.accept_workspace_invitation(text) from public;
grant execute on function public.accept_workspace_invitation(text) to authenticated;
grant execute on function public.accept_workspace_invitation(text) to service_role;

-- ---------------------------------------------------------------------------
-- 2) api_keys + incidents: bind project_id to accessible projects
-- ---------------------------------------------------------------------------

drop policy if exists "Users can insert their own API keys" on public.api_keys;
create policy "Users can insert their own API keys"
  on public.api_keys for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.user_can_manage_project(project_id)
  );

drop policy if exists "Users can update their own API keys" on public.api_keys;
create policy "Users can update their own API keys"
  on public.api_keys for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and public.user_can_manage_project(project_id)
  );

drop policy if exists "Users can insert their own API key logs"
  on public.api_key_logs;
create policy "Users can insert their own API key logs"
  on public.api_key_logs for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      project_id is null
      or public.user_can_manage_project(project_id)
    )
  );

drop policy if exists "Incidents are insertable by the owner" on public.incidents;
create policy "Incidents are insertable by the owner"
  on public.incidents for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.user_can_manage_project(project_id)
  );

drop policy if exists "Incidents are updatable by the owner" on public.incidents;
create policy "Incidents are updatable by the owner"
  on public.incidents for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and public.user_can_manage_project(project_id)
  );

-- errors / error_events / heartbeats / performance_logs: authenticated INSERT
-- policies are intentionally absent (SDK ingest uses service_role). No change.

-- ---------------------------------------------------------------------------
-- 3) profiles: lock privileged columns for authenticated role
-- ---------------------------------------------------------------------------

revoke update on table public.profiles from anon, authenticated;

-- Safe self-service columns used by settings / logout invalidation.
grant update (
  full_name,
  avatar_url,
  email,
  language,
  timezone,
  preferences,
  password_changed_at,
  mfa_enabled,
  sessions_invalidated_at
) on table public.profiles to authenticated;

-- Admin / entitlement / suspend paths use service_role.
grant select, insert, update, delete on table public.profiles to service_role;
