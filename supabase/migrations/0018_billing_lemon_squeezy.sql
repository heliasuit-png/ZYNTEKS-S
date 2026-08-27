-- =============================================================================
-- 0018 — Lemon Squeezy billing preparation (OPTIONAL / NOT APPLIED TO PROD HERE)
-- =============================================================================
-- Purpose: store provider customer/subscription ids + webhook idempotency.
-- Entitlement plan of record remains profiles.subscription_plan / workspaces.plan.
--
-- DO NOT apply this migration to production as part of the Lemon Squeezy prep
-- task unless explicitly approved. Apply to staging first.
-- =============================================================================

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  provider text not null default 'lemonsqueezy',
  provider_customer_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_customer_id)
);

create index if not exists billing_customers_user_id_idx
  on public.billing_customers (user_id);

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  provider text not null default 'lemonsqueezy',
  provider_subscription_id text not null,
  provider_customer_id text,
  plan public.subscription_plan not null default 'free',
  status text not null default 'unknown',
  paid_access_active boolean not null default false,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);

create index if not exists billing_subscriptions_user_id_idx
  on public.billing_subscriptions (user_id);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'lemonsqueezy',
  event_id text not null,
  event_name text not null,
  processed_at timestamptz not null default now(),
  unique (provider, event_id)
);

comment on table public.billing_customers is
  'Payment provider customer mapping (Lemon Squeezy). Secrets never stored.';
comment on table public.billing_subscriptions is
  'Mirror of provider subscription state; plan of record still on profiles/workspaces.';
comment on table public.billing_webhook_events is
  'Idempotency ledger for verified webhooks.';

alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_webhook_events enable row level security;

-- No policies for anon/authenticated — service_role only (webhooks).
revoke all on public.billing_customers from anon, authenticated;
revoke all on public.billing_subscriptions from anon, authenticated;
revoke all on public.billing_webhook_events from anon, authenticated;

grant all on public.billing_customers to service_role;
grant all on public.billing_subscriptions to service_role;
grant all on public.billing_webhook_events to service_role;
