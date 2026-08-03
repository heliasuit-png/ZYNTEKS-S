# Architecture

ZYNTEKSIS follows a clean, layered Next.js architecture suitable for long-term
maintenance by a multi-engineer team.

## Goals

- Clear dependency direction (UI → services → infrastructure)
- Feature isolation (no cross-feature imports for shared UI)
- Typed boundaries (Zod at HTTP/SDK edges; Supabase `Database` types)
- Operational safety (RLS, hashed API keys, env validation, cron auth)

## Layer diagram

```text
┌─────────────────────────────────────────────────────────────┐
│  app/            Routes, layouts, thin API handlers         │
├─────────────────────────────────────────────────────────────┤
│  features/       Product modules: UI, hooks, server actions │
├─────────────────────────────────────────────────────────────┤
│  services/       Domain / application logic (no React)      │
├─────────────────────────────────────────────────────────────┤
│  monitoring/     SDK ingest auth, validation, persistence   │
│  cron/           Job registry + authenticated entrypoints   │
│  ai/ emails/     External client factories                  │
├─────────────────────────────────────────────────────────────┤
│  lib/ supabase/ components/ utils/ types/ hooks/            │
│  Cross-cutting infrastructure and shared UI                 │
└─────────────────────────────────────────────────────────────┘
```

## Dependency rules

| From | May import | Must not import |
| ---- | ---------- | --------------- |
| `app/` | features, services, lib, components | — |
| `features/X` | services, lib, components, utils, own folders | `features/Y` (other features) |
| `services/` | lib, supabase types, other services carefully | React / features |
| `components/` | lib, utils, UI-only deps | features, services (prefer) |
| `monitoring/` / `cron/` | services, lib, supabase | features |

Shared UI that two features need belongs in `components/` (example:
`components/markdown/markdown-message.tsx`,
`components/billing/plan-comparison.tsx`).

## Request flows

### Browser session

1. `middleware.ts` refreshes Supabase session and protects dashboard routes  
2. Page or server action in `app/` / `features/*/server` or `actions.ts`  
3. Service uses user-scoped Supabase client (`createSupabaseServerClient`)  

### SDK ingest

1. `POST /api/sdk/*`  
2. `monitoring/http.ts` authenticates `ZYN-KEY-…`  
3. Rate limit → Zod validate → `monitoring/ingest.service.ts` → Postgres  

### Cron

1. Vercel Cron hits `/api/cron/*`  
2. `cron/auth.ts` validates `CRON_SECRET` (empty secret rejected)  
3. `cron/registry.ts` runs the job  

## Path aliases

Configured in `tsconfig.json` as `@/*` → repository root (plus named aliases
for `app`, `features`, `services`, …). Prefer `@/` imports over deep relatives.

## Environment

All runtime config is accessed through the `env` proxy in `lib/env.ts`.
Server-only secrets throw if read from client bundles.
`SKIP_ENV_VALIDATION` is forbidden when `NODE_ENV=production`.

## Extension points

| Concern | Swap point |
| ------- | ---------- |
| Payments | `services/billing/factory.ts` → `PaymentProvider` |
| Supabase clients | `supabase/client.ts`, `server.ts`, `admin.ts` |
| Cron jobs | `cron/registry.ts` + `cron/jobs/*` |
| SDK collectors | `sdk/src` collectors / transport |

## Related docs

- [Backend.md](./Backend.md) · [Frontend.md](./Frontend.md) · [Database.md](./Database.md)
- [API.md](./API.md) · [Monitoring.md](./Monitoring.md)
