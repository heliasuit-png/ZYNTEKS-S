# Billing

Plan catalog, usage limits, and a **pluggable payment provider**. No Stripe or
Paddle credentials ship in this package.

## What ships

| Piece | Location |
| ----- | -------- |
| Plan catalog / limits | `services/billing/catalog.ts` |
| Provider interface | `services/billing/provider.ts` |
| Factory (swap point) | `services/billing/factory.ts` |
| Placeholder impl | `services/billing/providers/placeholder.provider.ts` |
| UI | `features/billing/*`, `/billing`, `/pricing` |
| Format helpers | `utils/billing.ts` |
| Shared comparison table | `components/billing/plan-comparison.tsx` |

## PaymentProvider contract

```ts
interface PaymentProvider {
  id: string;
  displayName: string;
  isConfigured(): boolean;
  createCheckoutSession(input): Promise<…>;
  createBillingPortalSession(input): Promise<…>;
  changePlan(input): Promise<…>;
  listInvoices(providerCustomerId): Promise<…>;
  getSubscription(providerCustomerId): Promise<…>;
}
```

### Placeholder behavior

- `isConfigured()` → `false`  
- Checkout / portal / change plan → `{ status: "not_configured", redirectUrl: null, message }`  
- `listInvoices` → `[]`  
- `getSubscription` → `null`  
- No network calls, no webhooks  

## Integrating a real processor (post-sale)

1. Implement `PaymentProvider` for your vendor  
2. Return it from `services/billing/factory.ts`  
3. Add webhook route(s) if needed (new work — not included)  
4. Store customer/subscription IDs on profiles or a billing table via new migration  
5. Keep UI; only swap the provider  

## Plans & limits

Subscription plan enum on profiles: `free` | `pro` | `enterprise`
(`subscription_plan`). Limits (projects, API keys, AI usage, etc.) are enforced
in services via `services/account/plan.service.ts` and billing catalog helpers.

## UI honesty

Marketing and billing copy state that purchase flows open **placeholders**
until a provider is connected. Do not claim live card charging without wiring
a real provider.

## Related

[Architecture.md](./Architecture.md) · [Backend.md](./Backend.md) · [Deployment.md](./Deployment.md)
