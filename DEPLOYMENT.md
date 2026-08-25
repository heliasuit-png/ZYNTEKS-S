# Deployment

Canonical deep guide: **[docs/Deployment.md](docs/Deployment.md)**.  
Backup / recovery: **[docs/Backup-Recovery.md](docs/Backup-Recovery.md)**.

This page highlights **placeholders buyers must replace** before production.

---

## Recommended stack

**Supabase** (Postgres / Auth / Storage) + **Vercel** (Next.js + Cron).

---

## Placeholders — replace before go-live

Copy keys from [`.env.example`](.env.example) into the host env UI (Vercel →
Settings → Environment Variables). Values that still match the patterns below
are **not production-ready**.

| Variable | Example placeholder in `.env.example` | Buyer action |
| -------- | ------------------------------------- | ------------ |
| `NEXT_PUBLIC_APP_URL` | `https://zynteksisv.vercel.app` | Production origin (no trailing slash) |
| `NEXT_PUBLIC_APP_NAME` | `ZYNTEKSIS` | Keep or set your brand display name |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | **REPLACE** with your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-supabase-anon-key` | **REPLACE** with the `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-supabase-service-role-key` | **REPLACE** with the `service_role` secret (server only) |
| `OPENAI_API_KEY` | `sk-your-openai-api-key` | **REPLACE** with a real OpenAI secret key |
| `OPENAI_MODEL` | `gpt-4o-mini` | Keep or set a model your account can call |
| `RESEND_API_KEY` | `re_your-resend-api-key` | **REPLACE** with a Resend API key |
| `EMAIL_FROM` | `ZYNTEKSIS <noreply@your-domain.com>` | **REPLACE** with a **verified** Resend from-address |
| `CRON_SECRET` | `generate-a-long-random-secret` | **REPLACE** with a long random string; must match Vercel Cron auth |
| `LOG_LEVEL` | `info` | Optional: `debug` \| `info` \| `warn` \| `error` |

Also replace Auth URL examples:

| Setting | Production |
| ------- | ---------- |
| Site URL | `https://zynteksisv.vercel.app` |
| Redirect URLs | `https://zynteksisv.vercel.app/auth/callback` and `https://zynteksisv.vercel.app/auth/confirm` |

**Never** set `SKIP_ENV_VALIDATION` in production.

Keep `LEMON_SQUEEZY_MODE=off` unless payment is intentionally enabled.

---

## Deploy steps (short)

1. **Env validation** — no placeholders; `CRON_SECRET` server-only.  
2. **Database migrations** — apply `0001`…`0016`, `0017`, `0019`, `0020`, `0021`
   in order. Skip **`0018`** (payment-only) unless Lemon Squeezy is intentionally
   enabled. Apply DB migrations **before** deploying app code that depends on them.  
3. **Schema verification** — tables, buckets, `sessions_invalidated_at`, invite
   RPC, telemetry RLS helpers, AI quota RPCs.  
4. Configure Supabase Auth Site URL + redirects for the production domain.  
5. Import the Git repo to Vercel; Node 20+; build `npm run build`.  
6. Confirm [`vercel.json`](vercel.json) cron paths (`/api/cron/health`,
   `/api/cron/monitor`) and the same `CRON_SECRET`.  
7. **Post-deploy smoke** — `GET /api/health`, login, SDK heartbeat, cron 401
   without secret, `/status/<slug>`.  

Full procedure, cron schedules, rollback, and 0017–0021 timing:
[docs/Deployment.md](docs/Deployment.md).

Local first-success before deploy: [BUYER_QUICK_START.md](BUYER_QUICK_START.md) · [INSTALL.md](INSTALL.md).
