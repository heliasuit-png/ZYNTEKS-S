-- ---------------------------------------------------------------------------
-- Migration: Settings module profile preferences + avatar storage
-- Idempotent. Does not delete existing data.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists language text not null default 'en';

alter table public.profiles
  add column if not exists timezone text not null default 'UTC';

alter table public.profiles
  add column if not exists password_changed_at timestamptz;

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.preferences is
  'UI preferences: theme, accent, density, reducedMotion, sidebarStyle, aiStreaming, aiDefaultModel.';

-- Public avatar bucket (user uploads into {user_id}/…)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-logos',
  'workspace-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Workspace logos are publicly readable" on storage.objects;
create policy "Workspace logos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'workspace-logos');

drop policy if exists "Members can upload workspace logos" on storage.objects;
create policy "Members can upload workspace logos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'workspace-logos'
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id::text = (storage.foldername(name))[1]
        and wm.user_id = (select auth.uid())
        and wm.status = 'active'
        and wm.role in ('owner', 'administrator')
    )
  );

drop policy if exists "Members can update workspace logos" on storage.objects;
create policy "Members can update workspace logos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'workspace-logos'
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id::text = (storage.foldername(name))[1]
        and wm.user_id = (select auth.uid())
        and wm.status = 'active'
        and wm.role in ('owner', 'administrator')
    )
  );

drop policy if exists "Members can delete workspace logos" on storage.objects;
create policy "Members can delete workspace logos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'workspace-logos'
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id::text = (storage.foldername(name))[1]
        and wm.user_id = (select auth.uid())
        and wm.status = 'active'
        and wm.role in ('owner', 'administrator')
    )
  );
