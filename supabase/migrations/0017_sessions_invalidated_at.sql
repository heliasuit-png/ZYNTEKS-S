-- ---------------------------------------------------------------------------
-- Migration: server-side session invalidation stamp
-- Depends on: 0001_create_profiles.sql, 0006_create_workspaces_enterprise.sql
--
-- Supabase access JWTs remain cryptographically valid until expiry after
-- signOut. profiles.sessions_invalidated_at lets the app reject access tokens
-- issued at-or-before a logout / force-logout moment (compared to JWT iat).
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists sessions_invalidated_at timestamptz;

comment on column public.profiles.sessions_invalidated_at is
  'UTC timestamp of the latest global session invalidation (logout / force logout). Access tokens with iat at or before this instant must be rejected server-side.';

create index if not exists profiles_sessions_invalidated_at_idx
  on public.profiles (sessions_invalidated_at)
  where sessions_invalidated_at is not null;
