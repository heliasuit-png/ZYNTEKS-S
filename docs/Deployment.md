# Deployment

Production deployment guide for ZYNTEKSIS (Supabase + Vercel).

Buyer-facing placeholder summary: [../DEPLOYMENT.md](../DEPLOYMENT.md).  
Local setup: [../INSTALL.md](../INSTALL.md) · [../BUYER_QUICK_START.md](../BUYER_QUICK_START.md).

## Architecture (runtime)

```text
Clients (Browser / SDK)
        │
        ▼
   Vercel (Next.js 15)
        ├── Supabase Auth / Postgres / Storage
        ├── OpenAI
        ├── Resend
        └── Vercel Cron → /api/cron/*
```

## Prerequisites

- Node.js ≥ 20 for local builds (`node -v`)
- Supabase project
- Vercel project (or compatible Next.js host)
- OpenAI + Resend accounts for full production features
- Source via **your** Git remote or uploaded project (no public default URL)

## 1. Database

Apply `supabase/migrations/` **0001 → 0009** in order.

See [Database.md](./Database.md) for tables, enums, and rollback strategy.

Confirm Storage buckets from migration `0009`:

- `avatars`
- `workspace-logos`

## 2. Supabase Auth URLs

Use the production application URL:

| Setting | Production value |
| ------- | ---------------- |
| Site URL | `https://zynteksisv.vercel.app` |
| Redirect URLs | `https://zynteksisv.vercel.app/auth/callback` |
| | `https://zynteksisv.vercel.app/auth/confirm` |

## 3. Environment variables (placeholders to replace)

Set the same keys as [`.env.example`](../.env.example) in the Vercel project
(Production / Preview as needed).

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

Generate a production cron secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Do not** set `SKIP_ENV_VALIDATION` in production (`lib/env.ts` forbids it).

## 4. Vercel

1. Import **your** Git repository (or deploy from the commercial source you own)  
2. Framework: Next.js  
3. Node 20+  
4. Build command: `npm run build`  
5. Set all production environment variables (section 3 — no placeholders left)

## 5. Cron

From [`vercel.json`](../vercel.json):

| Path | Schedule |
| ---- | -------- |
| `/api/cron/health` | every 15 minutes |
| `/api/cron/monitor` | every minute |

Authenticate with `CRON_SECRET` (`Authorization: Bearer …`).

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/health
```

Replace `your-domain.com` and ensure `$CRON_SECRET` is the real production value (not `generate-a-long-random-secret`).

## 6. Custom domain

1. Attach domain in Vercel  
2. Set `NEXT_PUBLIC_APP_URL` to the https origin (no trailing slash)  
3. Update Supabase Auth URLs  
4. Align Resend domain / `EMAIL_FROM`  

## 7. Post-deploy checklist

- [ ] No env value still matches `your-…`, `sk-your-…`, `re_your-…`, or `generate-a-…`  
- [ ] `GET /api/health` → ok  
- [ ] Register / login  
- [ ] Create project + API key  
- [ ] Local SDK path-install + heartbeat visible  
- [ ] Cron authorized (401 without secret)  
- [ ] Avatar / logo upload (Storage)  
- [ ] AI chat smoke test  
- [ ] Invite email (if used)  
- [ ] Public `/status/[slug]`  
- [ ] Monitor cron can open incidents (`investigating`) after heartbeat timeout  

## 8. Application rollback

- Revert Vercel deployment to previous build  
- Schema: prefer forward-fix migrations (see Database.md)  

## Related

[Database.md](./Database.md) · [../ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) · [Billing.md](./Billing.md) · [../DEPLOYMENT.md](../DEPLOYMENT.md)
