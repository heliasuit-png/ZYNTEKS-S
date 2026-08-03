# Deployment

Canonical deep guide: **[docs/Deployment.md](docs/Deployment.md)**.

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
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Set to your **https** production origin (no trailing slash), e.g. `https://app.your-domain.com` |
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

| Setting | Placeholder pattern | Production |
| ------- | ------------------- | ---------- |
| Site URL | `http://localhost:3000` | `https://your-domain.com` |
| Redirect URLs | `http://localhost:3000/auth/...` | `https://your-domain.com/auth/callback` and `.../auth/confirm` |

**Never** set `SKIP_ENV_VALIDATION` in production.

---

## Deploy steps (short)

1. Apply migrations `supabase/migrations/0001` → `0009` in order.  
2. Set every production env var (table above — no placeholders left).  
3. Configure Supabase Auth Site URL + redirects for the production domain.  
4. Import the Git repo (or connect the delivery source) to Vercel; Node 20+; build `npm run build`.  
5. Confirm [`vercel.json`](vercel.json) cron paths and the same `CRON_SECRET`.  
6. Smoke-test: `GET /api/health`, login, SDK heartbeat, `/status/<slug>`.  

Full procedure, cron schedules, and rollback: [docs/Deployment.md](docs/Deployment.md).

Local first-success before deploy: [BUYER_QUICK_START.md](BUYER_QUICK_START.md) · [INSTALL.md](INSTALL.md).
