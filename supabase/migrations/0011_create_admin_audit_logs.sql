-- ---------------------------------------------------------------------------
-- Migration: Platform admin audit log for Enterprise Admin Control Center.
-- Depends on: 0010_create_admin_users.sql
-- ---------------------------------------------------------------------------

create type public.admin_audit_action as enum (
  'user_promoted',
  'user_demoted',
  'user_suspended',
  'user_reactivated',
  'user_password_reset',
  'user_force_logout',
  'user_deleted',
  'workspace_transferred'
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action public.admin_audit_action not null,
  target_user_id uuid references auth.users (id) on delete set null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

comment on table public.admin_audit_logs is
  'Immutable-style audit trail for Enterprise Admin Control Center actions.';

create index admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index admin_audit_logs_actor_id_idx
  on public.admin_audit_logs (actor_id);

create index admin_audit_logs_target_user_id_idx
  on public.admin_audit_logs (target_user_id);

alter table public.admin_audit_logs enable row level security;

-- Platform admins may read audit rows (membership via admin_users).
create policy "Platform admins can select admin audit logs"
  on public.admin_audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = (select auth.uid())
    )
  );

-- Inserts are performed with the service-role client (no authenticated insert policy).
