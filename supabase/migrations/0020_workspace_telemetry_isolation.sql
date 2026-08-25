-- ---------------------------------------------------------------------------
-- Migration: Workspace-aware telemetry SELECT + shared key/incident visibility
-- Depends on: 0002, 0003, 0004, 0006, 0019
--
-- Phase C: members of a workspace can SELECT project-scoped telemetry for
-- projects in that workspace. Cross-workspace SELECT remains denied.
-- Client-supplied workspace_id / project_id cannot escalate past RLS helpers.
-- ---------------------------------------------------------------------------

create or replace function public.user_can_view_project(p_project_id uuid)
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
        or public.is_workspace_member(p.workspace_id)
      )
  );
$$;

revoke all on function public.user_can_view_project(uuid) from public;
grant execute on function public.user_can_view_project(uuid) to authenticated;
grant execute on function public.user_can_view_project(uuid) to service_role;

-- errors
drop policy if exists "Errors are viewable by the owner" on public.errors;
create policy "Errors are viewable by project members"
  on public.errors for select to authenticated
  using (public.user_can_view_project(project_id));

-- error_events
drop policy if exists "Error events are viewable by the owner" on public.error_events;
create policy "Error events are viewable by project members"
  on public.error_events for select to authenticated
  using (public.user_can_view_project(project_id));

-- heartbeats
drop policy if exists "Heartbeats are viewable by the owner" on public.heartbeats;
create policy "Heartbeats are viewable by project members"
  on public.heartbeats for select to authenticated
  using (public.user_can_view_project(project_id));

-- performance_logs
drop policy if exists "Performance logs are viewable by the owner"
  on public.performance_logs;
create policy "Performance logs are viewable by project members"
  on public.performance_logs for select to authenticated
  using (public.user_can_view_project(project_id));

-- incidents
drop policy if exists "Incidents are viewable by the owner" on public.incidents;
create policy "Incidents are viewable by project members"
  on public.incidents for select to authenticated
  using (public.user_can_view_project(project_id));

drop policy if exists "Incidents are updatable by the owner" on public.incidents;
create policy "Incidents are updatable by project managers"
  on public.incidents for update to authenticated
  using (public.user_can_manage_project(project_id))
  with check (public.user_can_manage_project(project_id));

-- incident_updates: view via parent incident's project
drop policy if exists "Incident updates are viewable by the owner"
  on public.incident_updates;
create policy "Incident updates are viewable by project members"
  on public.incident_updates for select to authenticated
  using (
    exists (
      select 1
      from public.incidents i
      where i.id = incident_id
        and public.user_can_view_project(i.project_id)
    )
  );

drop policy if exists "Incident updates are insertable by the owner"
  on public.incident_updates;
create policy "Incident updates are insertable by project managers"
  on public.incident_updates for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.incidents i
      where i.id = incident_id
        and public.user_can_manage_project(i.project_id)
    )
  );

-- api_keys: shared project visibility; manage for write/delete
drop policy if exists "API keys are viewable by the owner" on public.api_keys;
create policy "API keys are viewable by project members"
  on public.api_keys for select to authenticated
  using (public.user_can_view_project(project_id));

drop policy if exists "Users can update their own API keys" on public.api_keys;
create policy "API keys are updatable by project managers"
  on public.api_keys for update to authenticated
  using (public.user_can_manage_project(project_id))
  with check (public.user_can_manage_project(project_id));

drop policy if exists "Users can delete their own API keys" on public.api_keys;
create policy "API keys are deletable by project managers"
  on public.api_keys for delete to authenticated
  using (public.user_can_manage_project(project_id));

-- Keep INSERT policy from 0019 (own user_id + manage project).

-- api_key_logs
drop policy if exists "API key logs are viewable by the owner" on public.api_key_logs;
create policy "API key logs are viewable by project members"
  on public.api_key_logs for select to authenticated
  using (
    (
      project_id is not null
      and public.user_can_view_project(project_id)
    )
    or (
      project_id is null
      and (select auth.uid()) = user_id
    )
  );

-- status_pages: bind to manageable ownership (owner_id must be caller)
-- Existing policies use user_id = auth.uid(); keep that for private status pages.
-- Harden INSERT if missing project link — status_pages use user_id only (OK).

comment on function public.user_can_view_project(uuid) is
  'True when auth.uid() owns the project or is an active member of its workspace.';
