-- =============================================================================
-- 0022 — Extend Lemon Squeezy billing mirror (OPTIONAL / NOT APPLIED HERE)
-- =============================================================================
-- Builds on 0018_billing_lemon_squeezy.sql. Apply to staging first.
-- Entitlement plan of record remains profiles.subscription_plan / workspaces.plan
-- (free | pro | enterprise). commercial_plan stores developer|pro|business.
-- =============================================================================

alter table public.billing_subscriptions
  add column if not exists lemon_order_id text,
  add column if not exists lemon_product_id text,
  add column if not exists lemon_variant_id text,
  add column if not exists commercial_plan text,
  add column if not exists renews_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists cancelled boolean not null default false,
  add column if not exists pause_mode text,
  add column if not exists raw_status text;

comment on column public.billing_subscriptions.commercial_plan is
  'Lemon commercial plan slug: developer | pro | business (presentation).';
comment on column public.billing_subscriptions.plan is
  'Local entitlement enum: free | pro | enterprise.';

alter table public.billing_webhook_events
  add column if not exists payload_summary jsonb,
  add column if not exists created_at timestamptz not null default now();

comment on column public.billing_webhook_events.payload_summary is
  'Optional non-sensitive event summary for audit (no secrets / card data).';
