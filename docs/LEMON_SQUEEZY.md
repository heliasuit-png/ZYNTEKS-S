# Lemon Squeezy (TEST MODE preparation)

Zynteksis ships a pluggable `PaymentProvider`. The default remains
`PlaceholderPaymentProvider`. When **test** credentials are configured,
`LemonSqueezyPaymentProvider` is selected automatically.

> **This repository does not enable LIVE charging by default.**  
> Do not set `LEMON_SQUEEZY_ALLOW_LIVE=true` until you intentionally go live.

## Architecture

```
UI / BillingService
      ↓
PaymentProvider (factory)
      ↓
Placeholder  OR  LemonSqueezyPaymentProvider
      ↓
Lemon Squeezy Checkout / Customer Portal
      ↓
Webhook /api/webhooks/lemonsqueezy  (HMAC verified)
      ↓
Entitlement → profiles.subscription_plan + workspaces.plan
      ↓
Existing AI / project / API key limits (AI_MONTHLY_MESSAGE_LIMITS, PLAN_LIMITS)
```

**Critical rule:** Frontend `?checkout=returned` must **never** grant plan or AI
quota. Only verified webhooks (or verified API state) update entitlement.

## Test Mode setup

1. Create a Lemon Squeezy **test** store.
2. Create products/variants for Pro and Enterprise (month + year as needed).
3. Create a webhook pointing to:
   `{APP_URL}/api/webhooks/lemonsqueezy`
4. Subscribe to:
   - `subscription_created`, `subscription_updated`, `subscription_cancelled`
   - `subscription_resumed`, `subscription_expired`, `subscription_paused`
   - `subscription_unpaused`, `subscription_plan_changed`
   - `order_created`, `order_refunded`
5. Copy the webhook signing secret (test).

## Environment variables

Add to `.env.local` / staging (placeholders only — never commit secrets):

```bash
LEMON_SQUEEZY_MODE=test          # off | test | live
LEMON_SQUEEZY_API_KEY=           # test API key
LEMON_SQUEEZY_STORE_ID=          # test store id
LEMON_SQUEEZY_WEBHOOK_SECRET=    # webhook signing secret
LEMON_SQUEEZY_ALLOW_LIVE=false   # must stay false for prep
# Optional override:
# LEMON_SQUEEZY_API_BASE_URL=https://api.lemonsqueezy.com/v1

LEMON_SQUEEZY_VARIANT_PRO_MONTH=
LEMON_SQUEEZY_VARIANT_PRO_YEAR=
LEMON_SQUEEZY_VARIANT_ENTERPRISE_MONTH=
LEMON_SQUEEZY_VARIANT_ENTERPRISE_YEAR=
```

`LEMON_SQUEEZY_MODE=off` (default) keeps the placeholder provider.

## Store / variant mapping

Plans in catalog: `free` | `pro` | `enterprise`.

| Plan | Interval | Env key |
| ---- | -------- | ------- |
| pro | month | `LEMON_SQUEEZY_VARIANT_PRO_MONTH` |
| pro | year | `LEMON_SQUEEZY_VARIANT_PRO_YEAR` |
| enterprise | month | `LEMON_SQUEEZY_VARIANT_ENTERPRISE_MONTH` |
| enterprise | year | `LEMON_SQUEEZY_VARIANT_ENTERPRISE_YEAR` |

Free has no variant.

## Checkout

`BillingService.startPurchase` → `createCheckoutSession`:

- Uses **server-authenticated** `userId` + `workspaceId` in Lemon `checkout_data.custom`
- Never trusts a client-supplied arbitrary user id for entitlement
- Redirects to Lemon hosted checkout URL
- Success redirect: `/billing?checkout=returned` (informational only)

## Webhook & signature

Route: `POST /api/webhooks/lemonsqueezy`

1. Read **raw body**
2. Verify `X-Signature` = HMAC-SHA256(rawBody, webhook secret) hex
3. Invalid → **401**
4. Valid → parse JSON → idempotent event processing

Secrets are never logged.

## Subscription lifecycle → entitlement

| Lemon status / event | Paid access |
| -------------------- | ----------- |
| `on_trial`, `active`, `past_due`, `paused` | Keep mapped paid plan |
| `cancelled` before period end | Keep paid plan until `ends_at` |
| `expired`, hard `unpaid`, refund | Fall back to `free` |

AI message quota follows plan via existing `AI_MONTHLY_MESSAGE_LIMITS` — no
separate credit wallet grant on checkout.

## Customer portal

Portal URLs are fetched from Lemon Squeezy subscription `urls.customer_portal`.
No static/fake portal URLs are invented.

## Optional DB migration

`supabase/migrations/0018_billing_lemon_squeezy.sql` adds:

- `billing_customers`
- `billing_subscriptions`
- `billing_webhook_events` (idempotency)

**Payment migration — only when Lemon Squeezy is intentionally enabled.**

Do **not** apply `0018` as part of a default non-payment deploy. Keep
`LEMON_SQUEEZY_MODE=off` until credentials and an explicit enablement decision
exist. Staging first if you do apply it. Plan of record remains
`profiles.subscription_plan` / `workspaces.plan` even without 0018.

Non-payment schema path: `0001`…`0016`, `0017`, `0019` — see [Database.md](./Database.md).

## Testing (local / smoke)

```bash
npm run test:smoke
```

Covers: missing config, live block, variant mapping, signature valid/invalid,
duplicate webhooks, subscription/order events, entitlement decisions.

Do **not** run real LIVE checkouts in this prep task.

## Going live checklist

1. Apply migration **0018** only when Lemon is intentionally enabled (staging
   first, then production with explicit approval). Skip 0018 for non-payment deploys.
2. Create LIVE store + variants; map env to LIVE variant ids.
3. Point LIVE webhook to production `/api/webhooks/lemonsqueezy`.
4. Set `LEMON_SQUEEZY_MODE=live` **and** `LEMON_SQUEEZY_ALLOW_LIVE=true`.
5. Verify signature + one subscription_created dry-run on staging first.
6. Confirm frontend never treats redirect as paid entitlement.
7. Monitor logs for `lemonsqueezy_webhook` (event name + status only).

## Related code

| Piece | Path |
| ----- | ---- |
| Config | `services/billing/lemon-squeezy/config.ts` |
| Variants | `services/billing/lemon-squeezy/variants.ts` |
| Signature | `services/billing/lemon-squeezy/signature.ts` |
| Entitlement | `services/billing/lemon-squeezy/entitlement.ts` |
| Webhook processor | `services/billing/lemon-squeezy/webhook-processor.ts` |
| Provider | `services/billing/providers/lemon-squeezy.provider.ts` |
| Factory | `services/billing/factory.ts` |
| Webhook route | `app/api/webhooks/lemonsqueezy/route.ts` |

See also [Billing.md](./Billing.md).
