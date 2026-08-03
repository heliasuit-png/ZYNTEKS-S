-- ---------------------------------------------------------------------------
-- Migration: create profiles table, enums, RLS policies and signup trigger.
-- ---------------------------------------------------------------------------

-- Enumerated domains -------------------------------------------------------

create type public.user_role as enum ('user', 'admin');
create type public.user_status as enum ('active', 'inactive', 'banned');
create type public.subscription_plan as enum ('free', 'pro', 'enterprise');

-- Profiles table -----------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  subscription_plan public.subscription_plan not null default 'free',
  role public.user_role not null default 'user',
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data linked one-to-one with auth.users.';

create unique index profiles_email_key on public.profiles (lower(email));

-- Keep updated_at in sync --------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Automatically create a profile when a new auth user is created -----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Row Level Security -------------------------------------------------------

alter table public.profiles enable row level security;

create policy "Profiles are viewable by the owner"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
