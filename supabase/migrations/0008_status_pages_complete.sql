-- ---------------------------------------------------------------------------
-- Migration: Complete Status Pages module
-- Customization fields, component keys, maintenance windows, RLS.
-- Idempotent where possible. Does not delete existing data.
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.status_maintenance_status as enum (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

-- Customization on status_pages ------------------------------------------------

alter table public.status_pages
  add column if not exists logo_url text;

alter table public.status_pages
  add column if not exists brand_color text not null default '#3B82F6';

alter table public.status_pages
  add column if not exists timezone text not null default 'UTC';

alter table public.status_pages
  add column if not exists contact_email text;

alter table public.status_pages
  add column if not exists footer_text text;

-- Component key for auto-derived system components -----------------------------

alter table public.status_page_components
  add column if not exists component_key text;

create index if not exists status_page_components_key_idx
  on public.status_page_components (status_page_id, component_key);

-- Maintenance windows ----------------------------------------------------------

create table if not exists public.status_page_maintenance (
  id uuid primary key default gen_random_uuid(),
  status_page_id uuid not null references public.status_pages (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  status public.status_maintenance_status not null default 'scheduled',
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint status_page_maintenance_window_check
    check (scheduled_end > scheduled_start)
);

comment on table public.status_page_maintenance is
  'Scheduled and historical maintenance windows for a status page.';

create index if not exists status_page_maintenance_page_idx
  on public.status_page_maintenance (status_page_id, scheduled_start desc);

create index if not exists status_page_maintenance_status_idx
  on public.status_page_maintenance (status_page_id, status);

drop trigger if exists status_page_maintenance_set_updated_at
  on public.status_page_maintenance;
create trigger status_page_maintenance_set_updated_at
  before update on public.status_page_maintenance
  for each row
  execute function public.handle_updated_at();

alter table public.status_page_maintenance enable row level security;

drop policy if exists "Status page maintenance is manageable by the owner"
  on public.status_page_maintenance;
create policy "Status page maintenance is manageable by the owner"
  on public.status_page_maintenance for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Public status page maintenance is viewable by anyone"
  on public.status_page_maintenance;
create policy "Public status page maintenance is viewable by anyone"
  on public.status_page_maintenance for select to anon, authenticated
  using (
    exists (
      select 1 from public.status_pages sp
      where sp.id = status_page_id and sp.is_public
    )
  );
