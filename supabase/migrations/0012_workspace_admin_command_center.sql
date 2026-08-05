-- ---------------------------------------------------------------------------
-- Migration: Workspace Command Center admin status + audit action extensions.
-- Depends on: 0011_create_admin_audit_logs.sql, 0006_create_workspaces_enterprise.sql
-- ---------------------------------------------------------------------------

create type public.workspace_admin_status as enum (
  'active',
  'suspended',
  'archived'
);

alter table public.workspaces
  add column if not exists admin_status public.workspace_admin_status not null default 'active';

comment on column public.workspaces.admin_status is
  'Platform admin lifecycle status for Enterprise Admin Control Center.';

create index if not exists workspaces_admin_status_idx
  on public.workspaces (admin_status);

alter table public.admin_audit_logs
  add column if not exists target_workspace_id uuid references public.workspaces (id) on delete set null;

create index if not exists admin_audit_logs_target_workspace_id_idx
  on public.admin_audit_logs (target_workspace_id);

alter type public.admin_audit_action add value 'workspace_suspended';
alter type public.admin_audit_action add value 'workspace_reactivated';
alter type public.admin_audit_action add value 'workspace_archived';
alter type public.admin_audit_action add value 'workspace_deleted';
alter type public.admin_audit_action add value 'workspace_renamed';
alter type public.admin_audit_action add value 'workspace_member_removed';
alter type public.admin_audit_action add value 'workspace_member_promoted';
alter type public.admin_audit_action add value 'workspace_member_demoted';
