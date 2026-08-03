# Buyer Quick Start (under 30 minutes)

Goal: from an empty machine to a running ZYNTEKSIS instance with heartbeat, error, AI, notification, and public status page verified.

Use this checklist for speed. Full detail: [INSTALL.md](INSTALL.md).

---

## Minute 0–5 — Source, Node, install

1. Obtain the commercial source (**Git URL** or **zip/folder**).
2. Open a terminal in the package root (folder that contains `package.json`).
3. Confirm Node ≥ 20:

```bash
node -v
npm -v
```

4. Install dependencies:

```bash
npm install
```

---

## Minute 5–12 — Supabase + env + migrations

1. Create a Supabase project (free tier is fine).
2. Copy env template:

```bash
cp .env.example .env.local
```

3. Replace **all placeholders** in `.env.local` (see table). Values marked **REPLACE** must not ship as-is.

| Variable | Action |
| -------- | ------ |
| `NEXT_PUBLIC_APP_URL` | Set `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Keep or set your brand |
| `NEXT_PUBLIC_SUPABASE_URL` | **REPLACE** — Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **REPLACE** — anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **REPLACE** — service_role key |
| `OPENAI_API_KEY` | **REPLACE** — required for AI step |
| `OPENAI_MODEL` | Keep `gpt-4o-mini` unless you need another |
| `RESEND_API_KEY` | **REPLACE** for email; optional for dashboard-only notifications |
| `EMAIL_FROM` | **REPLACE** with a Resend-verified sender |
| `CRON_SECRET` | **REPLACE** — run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `LOG_LEVEL` | `info` |

4. Apply SQL migrations `supabase/migrations/0001` … `0009` **in order** (SQL Editor paste/run each file).
5. Auth → URL Configuration:

- Site URL: `http://localhost:3000`
- Redirects: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/confirm`

---

## Minute 12–15 — Run the app

```bash
npm run dev
```

Smoke:

```bash
curl http://localhost:3000/api/health
```

Expect `"status":"ok"`.

---

## Minute 15–22 — Account, workspace, project, key, SDK

| # | Action | Where |
| - | ------ | ----- |
| 1 | Register with a **real email**, then log in | `/register` → `/login` |
| 2 | Create a workspace (or use the auto-created one; create one extra to verify) | Workspace switcher → **New workspace** |
| 3 | Create a project | `/projects` |
| 4 | Generate an API key; copy `ZYN-KEY-…` | Project API keys UI |
| 5 | Build SDK | `cd sdk && npm install && npm run build && cd ..` |
| 6 | In any sample browser app: `npm install <absolute-path-to>/sdk` and call `zyn.init()` with `endpoint: "http://localhost:3000"` | See [docs/SDK.md](docs/SDK.md) |

`@zynteksis/sdk` is **not** on the public npm registry. Always install from the local `sdk/` folder after building.

---

## Minute 22–28 — Telemetry, AI, status, notifications

| # | Action | Verify |
| - | ------ | ------ |
| 1 | Keep sample app open (heartbeats) | `/health` shows a recent heartbeat |
| 2 | `zyn.captureException(new Error("…"))` or curl `/api/sdk/error` | `/errors` lists the error |
| 3 | Open `/ai`, ask about recent errors | Streamed answer (needs `OPENAI_API_KEY`) |
| 4 | Create a public status page | `/status-pages` → open `/status/<slug>` logged out |
| 5 | Run monitor cron once | `curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/monitor` |
| 6 | Open notifications | `/notifications` shows **Project created** (and later critical/incident events) |

### Incident (may finish just after the 30-minute window)

Outage incidents open automatically when **no heartbeat** is received for **> 20 minutes**, then the monitor cron runs. Initial status is `investigating`.

1. Stop the sample app after a successful heartbeat.
2. Wait > 20 minutes (start this wait early if you need it inside the session).
3. Re-run the monitor cron curl above.
4. Confirm `/incidents` shows the outage.

---

## Minute 28–30 — Done criteria

- [ ] App boots; `/api/health` OK  
- [ ] Login works  
- [ ] Workspace + project + `ZYN-KEY-…` exist  
- [ ] Local SDK built and path-installed  
- [ ] Heartbeat + error visible in dashboard  
- [ ] AI reply received  
- [ ] Public `/status/<slug>` loads  
- [ ] At least one dashboard notification after cron  
- [ ] Incident appears after heartbeat timeout + cron (same day OK)

---

## Deploy next

When local success is green, follow [DEPLOYMENT.md](DEPLOYMENT.md) / [docs/Deployment.md](docs/Deployment.md). Every production env value that still looks like `your-…`, `sk-your-…`, `re_your-…`, or `generate-a-…` **must be replaced**.
