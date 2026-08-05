# Environment variables

Canonical template: [`.env.example`](.env.example)  
Validation: [`lib/env.ts`](lib/env.ts)

Copy `.env.example` → `.env.local` for local development. On Vercel, set the
same keys in the project Environment Variables UI.

Never commit real secrets. `.env.local` is gitignored.

---

## Application

| Variable | Required | Exposed to browser | Description | Where to get it |
| -------- | -------- | ------------------ | ----------- | --------------- |
| `NEXT_PUBLIC_APP_URL` | Yes | Yes | Canonical public URL (no trailing slash). Used for redirects, emails, absolute links. | Local: `http://localhost:3000`. Prod: your Vercel / custom domain `https://…` |
| `NEXT_PUBLIC_APP_NAME` | Yes | Yes | Product display name | Your brand string, default `ZYNTEKSIS` |

---

## Supabase

Dashboard: **Project Settings → API**  
https://supabase.com/dashboard/project/_/settings/api

| Variable | Required | Exposed to browser | Description | Where to get it |
| -------- | -------- | ------------------ | ----------- | --------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project URL | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Public anon key (RLS enforced) | Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **No** | Service role key; bypasses RLS. Server-only. | Settings → API → `service_role` **secret** |

> Treat `SUPABASE_SERVICE_ROLE_KEY` like a root password. Never prefix it with
> `NEXT_PUBLIC_`. Never ship it in client bundles or public docs.

---

## OpenAI

https://platform.openai.com/api-keys

| Variable | Required | Exposed to browser | Description | Where to get it |
| -------- | -------- | ------------------ | ----------- | --------------- |
| `OPENAI_API_KEY` | Production yes; local optional | No | API key for the assistant | OpenAI → API keys |
| `OPENAI_MODEL` | Yes (defaulted) | No | Chat model id | Default `gpt-4o-mini`; any chat-capable model your account can call |

Local development may leave `OPENAI_API_KEY` empty; AI features will fail until set.

---

## Email (Resend)

https://resend.com/api-keys

| Variable | Required | Exposed to browser | Description | Where to get it |
| -------- | -------- | ------------------ | ----------- | --------------- |
| `RESEND_API_KEY` | Production yes; local optional | No | Resend API key | Resend dashboard → API Keys |
| `EMAIL_FROM` | Production yes; local optional | No | From header, e.g. `ZYNTEKSIS <noreply@domain.com>` | Must use a domain verified in Resend |

---

## Cron

| Variable | Required | Exposed to browser | Description | Where to get it |
| -------- | -------- | ------------------ | ----------- | --------------- |
| `CRON_SECRET` | Production yes; local optional | No | Shared secret for `/api/cron/*` | Generate: `openssl rand -hex 32`. Set identically in Vercel env. |

Vercel Cron invokes the routes; the app expects `Authorization: Bearer <CRON_SECRET>`.

---

## Logging

| Variable | Required | Exposed to browser | Description | Where to get it |
| -------- | -------- | ------------------ | ----------- | --------------- |
| `LOG_LEVEL` | No (default `info`) | No | `debug` \| `info` \| `warn` \| `error` | Operator choice |

---

## OAuth providers (Authentication v2)

Optional. Gate “Continue with …” buttons in the app. Also configure the same Client ID/Secret in Supabase Auth → Providers. Full setup: [docs/authentication.md](./docs/authentication.md).

| Variable | Required | Exposed to browser | Description | Where to get it |
| -------- | -------- | ------------------ | ----------- | --------------- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | No | Google OAuth | Google Cloud Console |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | No | No | GitHub OAuth | GitHub Developer settings |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | No | No | Microsoft / Azure AD | Azure App registrations |
| `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` | No | No | Sign in with Apple | Apple Developer |

App callback: `{NEXT_PUBLIC_APP_URL}/auth/callback`  
Provider callback in Google/GitHub/etc.: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

---

## Optional — migration scripts only

Used by `scripts/apply-workspace-migration.mjs` and
`scripts/verify-workspace-migration.mjs`. **Not** read by the Next.js runtime.

| Variable | Required | Description | Where to get it |
| -------- | -------- | ----------- | --------------- |
| `DATABASE_URL` (or `SUPABASE_DB_URL` / `SUPABASE_DATABASE_URL` / `POSTGRES_URL`) | Only for those scripts | Postgres URI | Supabase → Settings → Database → Connection string |

---

## Optional — development tooling

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `SKIP_ENV_VALIDATION` | No | Set `true` / `1` to skip Zod validation in non-production. **Throws if used when `NODE_ENV=production`.** |

---

## Production vs development

| Context | Behavior |
| ------- | -------- |
| Development | `OPENAI_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET` may be empty strings |
| Production | Those secrets must be non-empty; validation fails otherwise |
| Always | Supabase URL/keys and `NEXT_PUBLIC_APP_URL` must be valid |

---

## Checklist before go-live

- [ ] All production-required variables set in the host
- [ ] `NEXT_PUBLIC_APP_URL` is https and matches the live domain
- [ ] Supabase Auth redirect URLs include production callback/confirm routes
- [ ] `CRON_SECRET` matches what cron callers send
- [ ] `EMAIL_FROM` domain verified in Resend
- [ ] No secrets committed to the repository
