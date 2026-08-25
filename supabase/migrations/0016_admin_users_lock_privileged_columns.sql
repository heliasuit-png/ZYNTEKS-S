-- ---------------------------------------------------------------------------
-- Migration: Lock privileged columns on public.admin_users for clients.
--
-- P1: Authenticated UPDATE RLS allowed any column on the caller's own row,
-- so a SUPPORT/ADMIN/READ_ONLY member could self-escalate via PostgREST:
--   update public.admin_users set role = 'SUPER_ADMIN' where user_id = auth.uid();
--
-- Fix: revoke table-level UPDATE from anon/authenticated, then grant UPDATE
-- only on last_login (used by touchAdminLastLogin with the user JWT client).
-- Role / user_id / created_at / id changes remain service-role only
-- (promoteUserToAdmin / demotePlatformAdmin and other admin management).
--
-- Does NOT change:
--   - SELECT own-row policy
--   - INSERT/DELETE policies (still none for authenticated)
--   - table schema / admin_platform_role enum
--   - application auth flows
-- ---------------------------------------------------------------------------

-- Drop any prior broad UPDATE privilege for browser/JWT roles.
revoke update on table public.admin_users from anon, authenticated;

-- last_login stamp only (admin password sign-in → touchAdminLastLogin).
grant update (last_login) on table public.admin_users to authenticated;

-- Explicitly retain full DML for service_role (admin management APIs).
-- Supabase projects usually already grant this; re-assert for safety.
grant select, insert, update, delete on table public.admin_users to service_role;

-- Own-row UPDATE RLS policy is kept as the row filter for last_login:
--   "Admin users can update own row"
--   using  ((select auth.uid()) = user_id)
--   with check ((select auth.uid()) = user_id)
-- SELECT policy "Admin users can select own row" is unchanged.
