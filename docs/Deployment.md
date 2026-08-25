# Deployment

Production deployment guide for ZYNTEKSIS (Supabase + Vercel).

Buyer-facing placeholder summary: [../DEPLOYMENT.md](../DEPLOYMENT.md).  
Local setup: [../INSTALL.md](../INSTALL.md) · [../BUYER_QUICK_START.md](../BUYER_QUICK_START.md).  
Backup / restore: [Backup-Recovery.md](./Backup-Recovery.md).

## Architecture (runtime)

```text
Clients (Browser / SDK)
        │
        ▼
   Vercel (Next.js 15)
        ├── Supabase Auth / Postgres / Storage
        ├── OpenAI
        ├── Resend
        └── Vercel Cron → /api/cron/*  (Authorization: Bearer CRON_SECRET)
```

## Prerequisites

- Node.js ≥ 20 for local builds (`node -v`)
- Supabase project
- Vercel project (or compatible Next.js host)
- OpenAI + Resend accounts for full production features
- Source via **your** Git remote or uploaded project (no public default URL)

---

## Fresh deployment sequence

Follow this order. **Do not** deploy application code that depends on new SQL
before the matching migrations are applied on that environment’s database.

### 1. Environment validation

1. Copy [`.env.example`](../.env.example) → host env (Vercel Production / Preview).
2. Replace every placeholder (`your-…`, `sk-your-…`, `re_your-…`,
   `generate-a-long-random-secret`).
3. Confirm `CRON_SECRET` is a long random server-only secret (**not**
   `NEXT_PUBLIC_*`).
4. Confirm `LEMON_SQUEEZY_MODE=off` unless Lemon is intentionally enabled
   (see [LEMON_SQUEEZY.md](./LEMON_SQUEEZY.md)).
5. **Do not** set `SKIP_ENV_VALIDATION` in production.

Generate a production cron secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Database migrations

Apply `supabase/migrations/` in repository order for the **non-payment** path:

`0001` → `0002` → … → `0016` → `0017` → `0019` → `0020` → `0021`

Skip **`0018_billing_lemon_squeezy.sql`** unless Lemon Squeezy is intentionally
enabled (payment migration — separate approval; out of band from core release).

| Migration | Why it matters before go-live |
| --------- | ----------------------------- |
| **0017** | Session invalidation stamp used by logout / force-logout / suspend |
| **0019** | Critical RLS hardening (members, API keys, privileged profile columns) |
| **0020** | Workspace telemetry / API key / incident SELECT isolation helpers |
| **0021** | `workspaces.owner_id` guard + atomic AI quota RPCs |

**Production rule:** apply SQL on the production Supabase project **before**
shipping an app build that calls new RPCs (for example
`accept_workspace_invitation`) or assumes new columns/policies.

Staging apply helper (staging host only):
`node scripts/apply-staging-migrations.mjs`

Full table: [Database.md](./Database.md).

### 3. Schema verification

- Required public tables exist (`profiles`, `workspaces`, `projects`, `api_keys`, …)
- Storage buckets from `0009`: `avatars`, `workspace-logos`
- After **0017**: `profiles.sessions_invalidated_at` present
- After **0019**: `accept_workspace_invitation` RPC callable by authenticated role

### 4. Auth / session checks

Configure Supabase Auth URLs for the production origin:

| Setting | Production value |
| ------- | ---------------- |
| Site URL | `https://zynteksisv.vercel.app` (or your custom domain) |
| Redirect URLs | `…/auth/callback` and `…/auth/confirm` on that origin |

Smoke: register / login / logout; protected routes reject retained JWT after
logout when **0017** + app session checks are live.

### 5. Security checks

- Service role key only on the server / Vercel env (never client)
- Cron routes reject missing/wrong `Authorization: Bearer`
- Prefer applying **0019** before broad production traffic

### 6. Build

```bash
npm run typecheck
npm run lint
npm run test:smoke
npm run build
npm run sdk:build
```

### 7. Deploy (application)

1. Import Git repository to Vercel  
2. Framework: Next.js · Node 20+ · build `npm run build`  
3. Env vars set (section 1)  
4. Confirm [`vercel.json`](../vercel.json) cron paths  
5. Deploy  

Vercel Cron schedules (shipped Hobby-compatible; Pro unlocks higher frequency):

| Path | Schedule |
| ---- | -------- |
| `/api/cron/health` | `0 0 * * *` (daily 00:00 UTC; Pro: e.g. `*/15 * * * *`) |
| `/api/cron/monitor` | `0 1 * * *` (daily 01:00 UTC; Pro: e.g. `* * * * *`) |

Auth: `Authorization: Bearer <CRON_SECRET>` (`cron/auth.ts`). Empty secret →
all cron requests rejected. Secret must not appear in any `NEXT_PUBLIC_*` var
or client bundle.

Manual probe (non-production or break-glass only):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/health
```

### 8. Post-deploy smoke

- [ ] No env value still matches `your-…`, `sk-your-…`, `re_your-…`, or `generate-a-…`  
- [ ] `GET /api/health` → ok  
- [ ] Register / login / logout  
- [ ] Create project + API key  
- [ ] Local SDK path-install + heartbeat visible  
- [ ] Cron unauthorized → 401; authorized health/monitor → ok  
- [ ] Avatar / logo upload (Storage)  
- [ ] AI chat smoke test (if OpenAI configured)  
- [ ] Invite accept (requires **0019** RPC)  
- [ ] Public `/status/[slug]`  
- [ ] Monitor can open incidents (`investigating`) after heartbeat timeout  

---

## Environment variables (placeholders to replace)

| Variable | Placeholder pattern in `.env.example` | Must replace? |
| -------- | ------------------------------------- | ------------- |
| `NEXT_PUBLIC_APP_URL` | `https://zynteksisv.vercel.app` | **Yes** — production origin, no trailing slash |
| `NEXT_PUBLIC_APP_NAME` | `ZYNTEKSIS` | Optional brand rename |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | **Yes** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-supabase-anon-key` | **Yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-supabase-service-role-key` | **Yes** (server only) |
| `OPENAI_API_KEY` | `sk-your-openai-api-key` | **Yes** for AI |
| `OPENAI_MODEL` | `gpt-4o-mini` | Change only if needed |
| `RESEND_API_KEY` | `re_your-resend-api-key` | **Yes** for email |
| `EMAIL_FROM` | `…@your-domain.com` | **Yes** — verified Resend domain |
| `CRON_SECRET` | `generate-a-long-random-secret` | **Yes** — long random; match cron auth |
| `LOG_LEVEL` | `info` | Optional |

---

## Custom domain

1. Attach domain in Vercel  
2. Set `NEXT_PUBLIC_APP_URL` to the https origin (no trailing slash)  
3. Update Supabase Auth URLs  
4. Align Resend domain / `EMAIL_FROM`  

---

## Application rollback

- Revert Vercel deployment to previous build when the defect is app-only  
- Schema: prefer forward-fix migrations (see Database.md)  
- If data corruption / bad migration: see [Backup-Recovery.md](./Backup-Recovery.md)  

---

## Related

[Database.md](./Database.md) · [Backup-Recovery.md](./Backup-Recovery.md) ·
[../ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) · [Billing.md](./Billing.md) ·
[../DEPLOYMENT.md](../DEPLOYMENT.md)
