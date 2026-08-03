-- ---------------------------------------------------------------------------
-- Migration: AI Code Health Assistant.
-- Conversations, messages, feedback and usage tracking.
-- Depends on 0001 (public.handle_updated_at) and 0002 (projects).
-- ---------------------------------------------------------------------------

create type public.ai_message_role as enum ('user', 'assistant', 'system');
create type public.ai_feedback_rating as enum ('up', 'down');

-- Conversations ------------------------------------------------------------

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null default 'New conversation',
  model text not null,
  pinned boolean not null default false,
  message_count integer not null default 0,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_conversations is 'AI assistant conversations, optionally scoped to a project.';

create index ai_conversations_user_recent_idx
  on public.ai_conversations (user_id, last_message_at desc);
create index ai_conversations_user_pinned_idx
  on public.ai_conversations (user_id, pinned, updated_at desc);
create index ai_conversations_project_idx
  on public.ai_conversations (project_id);

create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row
  execute function public.handle_updated_at();

-- Messages -----------------------------------------------------------------

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.ai_message_role not null,
  content text not null,
  model text,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  created_at timestamptz not null default now()
);

comment on table public.ai_messages is 'Individual messages within an AI conversation.';

create index ai_messages_conversation_created_idx
  on public.ai_messages (conversation_id, created_at);
create index ai_messages_user_idx on public.ai_messages (user_id);

-- Keep conversation counters in sync with message inserts/deletes.
create or replace function public.handle_ai_message_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.ai_conversations
      set message_count = message_count + 1,
          last_message_at = new.created_at,
          updated_at = now()
      where id = new.conversation_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.ai_conversations
      set message_count = greatest(0, message_count - 1),
          updated_at = now()
      where id = old.conversation_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger ai_messages_sync_counters
  after insert or delete on public.ai_messages
  for each row
  execute function public.handle_ai_message_change();

-- Feedback -----------------------------------------------------------------

create table public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.ai_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating public.ai_feedback_rating not null,
  comment text,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

comment on table public.ai_feedback is 'Thumbs up/down feedback on assistant messages.';

create index ai_feedback_user_idx on public.ai_feedback (user_id);

-- Usage --------------------------------------------------------------------

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  message_id uuid references public.ai_messages (id) on delete set null,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.ai_usage is 'Per-request AI usage records used for monthly quotas and token accounting.';

create index ai_usage_user_created_idx on public.ai_usage (user_id, created_at desc);

-- Row Level Security -------------------------------------------------------

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_feedback enable row level security;
alter table public.ai_usage enable row level security;

create policy "AI conversations are viewable by the owner"
  on public.ai_conversations for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "AI conversations are insertable by the owner"
  on public.ai_conversations for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "AI conversations are updatable by the owner"
  on public.ai_conversations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "AI conversations are deletable by the owner"
  on public.ai_conversations for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "AI messages are viewable by the owner"
  on public.ai_messages for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "AI messages are insertable by the owner"
  on public.ai_messages for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "AI messages are deletable by the owner"
  on public.ai_messages for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "AI feedback is viewable by the owner"
  on public.ai_feedback for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "AI feedback is insertable by the owner"
  on public.ai_feedback for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "AI feedback is updatable by the owner"
  on public.ai_feedback for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "AI usage is viewable by the owner"
  on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "AI usage is insertable by the owner"
  on public.ai_usage for insert to authenticated
  with check ((select auth.uid()) = user_id);
