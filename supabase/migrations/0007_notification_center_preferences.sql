-- ---------------------------------------------------------------------------
-- Migration: Notification Center completion
-- - Per-category type preferences (jsonb)
-- - Allow users to view their own delivery queue (retry / failure status)
-- Idempotent and safe for existing preference rows.
-- ---------------------------------------------------------------------------

alter table public.notification_preferences
  add column if not exists type_preferences jsonb not null default '{}'::jsonb;

comment on column public.notification_preferences.type_preferences is
  'Per notification category channel matrix: { category: { email, dashboard, slack, discord } }.';

-- Users can inspect their own outbound queue for delivery status / retries.
drop policy if exists "Notification queue is viewable by the owner"
  on public.notification_queue;

create policy "Notification queue is viewable by the owner"
  on public.notification_queue for select to authenticated
  using ((select auth.uid()) = user_id);
