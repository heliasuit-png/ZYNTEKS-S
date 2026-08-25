-- ---------------------------------------------------------------------------
-- Migration: Phase D — workspace owner_id guard + atomic AI usage claim
-- Depends on: 0005, 0006, 0019, 0020
-- ---------------------------------------------------------------------------

-- 1) Prevent client PostgREST from reassigning workspace owner_id to a
--    non-member (or by a non-owner). Legitimate transferOwnership still works
--    when the caller is the current owner and the new owner is an active member.
create or replace function public.workspaces_guard_owner_id()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.owner_id is not distinct from old.owner_id then
    return new;
  end if;

  -- service_role / admin client (no JWT) may repair ownership.
  if auth.uid() is null then
    return new;
  end if;

  if auth.uid() is distinct from old.owner_id then
    raise exception 'only the current owner can transfer workspace ownership'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = old.id
      and wm.user_id = new.owner_id
      and wm.status = 'active'
  ) then
    raise exception 'new owner must be an active workspace member'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists workspaces_guard_owner_id on public.workspaces;
create trigger workspaces_guard_owner_id
  before update on public.workspaces
  for each row
  execute function public.workspaces_guard_owner_id();

-- 2) Atomic AI usage insert under a per-user advisory lock so concurrent
--    completions cannot both pass a soft pre-check and overshoot the monthly
--    message quota. Soft assert still happens in app code; this is the hard gate.
create or replace function public.ai_record_usage_atomic(
  p_user_id uuid,
  p_limit integer,
  p_conversation_id uuid,
  p_message_id uuid,
  p_model text,
  p_prompt_tokens integer,
  p_completion_tokens integer,
  p_total_tokens integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
  v_id uuid;
  v_month_start timestamptz := date_trunc('month', timezone('utc', now()));
begin
  if p_user_id is null then
    raise exception 'user required' using errcode = '22023';
  end if;

  -- Serialize claims for this user within the transaction.
  perform pg_advisory_xact_lock(hashtext('ai_usage:' || p_user_id::text));

  if p_limit is not null then
    select count(*)::integer
      into v_used
    from public.ai_usage
    where user_id = p_user_id
      and created_at >= v_month_start;

    if v_used >= p_limit then
      raise exception 'ai_quota_exceeded' using errcode = 'P0001';
    end if;
  end if;

  insert into public.ai_usage (
    user_id,
    conversation_id,
    message_id,
    model,
    prompt_tokens,
    completion_tokens,
    total_tokens
  )
  values (
    p_user_id,
    p_conversation_id,
    p_message_id,
    p_model,
    coalesce(p_prompt_tokens, 0),
    coalesce(p_completion_tokens, 0),
    coalesce(p_total_tokens, 0)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.ai_record_usage_atomic(
  uuid, integer, uuid, uuid, text, integer, integer, integer
) from public;
grant execute on function public.ai_record_usage_atomic(
  uuid, integer, uuid, uuid, text, integer, integer, integer
) to authenticated;
grant execute on function public.ai_record_usage_atomic(
  uuid, integer, uuid, uuid, text, integer, integer, integer
) to service_role;

create or replace function public.ai_usage_within_limit(
  p_user_id uuid,
  p_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
  v_month_start timestamptz := date_trunc('month', timezone('utc', now()));
begin
  if p_limit is null then
    return true;
  end if;

  perform pg_advisory_xact_lock(hashtext('ai_usage:' || p_user_id::text));

  select count(*)::integer
    into v_used
  from public.ai_usage
  where user_id = p_user_id
    and created_at >= v_month_start;

  return v_used < p_limit;
end;
$$;

revoke all on function public.ai_usage_within_limit(uuid, integer) from public;
grant execute on function public.ai_usage_within_limit(uuid, integer) to authenticated;
grant execute on function public.ai_usage_within_limit(uuid, integer) to service_role;
