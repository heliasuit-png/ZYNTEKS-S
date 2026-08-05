-- ---------------------------------------------------------------------------
-- Migration: Enterprise Admin Control Center — admin_users + platform roles.
-- Depends on: public.handle_updated_at() from 0001.
--
-- Bootstrap the first SUPER_ADMIN (replace <AUTH_USER_UUID> with a real
-- auth.users.id that already exists — typically after that user registers
-- via the normal product signup flow):
--
--   insert into public.admin_users (user_id, role)
--   values ('<AUTH_USER_UUID>', 'SUPER_ADMIN');
--
-- Do not seed demo rows in this migration.
-- ---------------------------------------------------------------------------

create type public.admin_platform_role as enum (
  'SUPER_ADMIN',
  'ADMIN',
  'SUPPORT',
  'READ_ONLY'
);

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role public.admin_platform_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login timestamptz
);

comment on table public.admin_users is
  'Platform administrators for the Enterprise Admin Control Center. Membership is the sole gate for /admin (not profiles.role or workspace RBAC).';

create index admin_users_user_id_idx on public.admin_users (user_id);

create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row
  execute function public.handle_updated_at();

alter table public.admin_users enable row level security;

-- Admins may read their own membership row (layout gate + dashboard).
create policy "Admin users can select own row"
  on public.admin_users
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Admins may update their own row (used to stamp last_login after admin sign-in).
-- Column-level restrictions are enforced in application services.
create policy "Admin users can update own row"
  on public.admin_users
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- No INSERT/DELETE policies for authenticated clients. Provisioning is done
-- via SQL / service-role in later admin modules.
