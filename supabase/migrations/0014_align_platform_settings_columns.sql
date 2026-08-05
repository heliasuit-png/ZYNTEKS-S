-- ---------------------------------------------------------------------------
-- Migration: Align platform_settings column names (Turkish / aliases → English)
-- Depends on: 0013_platform_settings_feature_flags.sql
--
-- Safe / idempotent:
--   - Renames bakim_etkin → maintenance_enabled when needed
--   - Renames bakim_mesaji → maintenance_message when needed
--   - Renames kayit_etkin → registration_enabled when needed
--   - Renames maintenance_mode → maintenance_enabled when needed
--   - If both legacy and canonical columns exist, copies non-null legacy values
--     into the canonical columns, then drops the legacy columns.
--   - No-op when the live schema is already English-only.
-- ---------------------------------------------------------------------------

create or replace function public._tmp_rename_platform_settings_column(
  p_from text,
  p_to text
)
returns void
language plpgsql
as $$
declare
  has_from boolean;
  has_to boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'platform_settings'
      and column_name = p_from
  ) into has_from;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'platform_settings'
      and column_name = p_to
  ) into has_to;

  if has_from and not has_to then
    execute format(
      'alter table public.platform_settings rename column %I to %I',
      p_from,
      p_to
    );
    return;
  end if;

  if has_from and has_to then
    -- Preserve any legacy values that differ, then drop the legacy column.
    execute format(
      'update public.platform_settings set %I = coalesce(%I, %I)',
      p_to,
      p_from,
      p_to
    );
    execute format(
      'alter table public.platform_settings drop column %I',
      p_from
    );
  end if;
end;
$$;

select public._tmp_rename_platform_settings_column('bakim_etkin', 'maintenance_enabled');
select public._tmp_rename_platform_settings_column('maintenance_mode', 'maintenance_enabled');
select public._tmp_rename_platform_settings_column('bakim_mesaji', 'maintenance_message');
select public._tmp_rename_platform_settings_column('kayit_etkin', 'registration_enabled');

-- Ensure canonical columns exist for environments that never ran 0013 cleanly.
alter table public.platform_settings
  add column if not exists maintenance_enabled boolean not null default false;

alter table public.platform_settings
  add column if not exists maintenance_message text;

alter table public.platform_settings
  add column if not exists registration_enabled boolean not null default true;

drop function public._tmp_rename_platform_settings_column(text, text);

comment on column public.platform_settings.maintenance_enabled is
  'When true, product dashboard enters maintenance mode.';
comment on column public.platform_settings.maintenance_message is
  'Optional message shown on the public maintenance page.';
comment on column public.platform_settings.registration_enabled is
  'When false, product /register is closed.';
