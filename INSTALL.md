# Installation

Complete local setup and **first-success checklist** for ZYNTEKSIS.

| Guide | Path |
| ----- | ---- |
| 30-minute buyer path | [BUYER_QUICK_START.md](BUYER_QUICK_START.md) |
| Production hosting | [docs/Deployment.md](docs/Deployment.md) |
| Database / migrations | [docs/Database.md](docs/Database.md) |
| SDK (local package) | [docs/SDK.md](docs/SDK.md) |
| Env reference | [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) |

---

## Prerequisites

| Requirement | Notes |
| ----------- | ----- |
| Node.js **≥ 20** | `node -v` |
| npm | Bundled with Node (`npm -v`) |
| Supabase project | Free tier is enough to start |
| OpenAI API key | Required to complete the AI checklist step |
| Resend API key | Required for invite / email delivery; dashboard notifications work via cron without email |
| Real email address | Supabase Auth rejects many synthetic domains; use an inbox you control |

Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) if you prefer CLI migrations over the SQL Editor.

---

## 1. Obtain the source and install

**Option A — Git repository (recommended when a remote is provided)**

```bash
git clone <REPLACE_WITH_YOUR_REPOSITORY_URL> zynteksis
cd zynteksis
npm install
```

Replace `<REPLACE_WITH_YOUR_REPOSITORY_URL>` with the Git URL from your license / delivery package.  
If the URL is missing, contact the seller — do not invent a public npm or GitHub URL.

**Option B — Zip / folder delivery (no Git remote)**

1. Extract the commercial package to a working directory (example: `zynteksis`).
2. Open a terminal in that directory (the folder that contains `package.json` and `supabase/`).
3. Install:

```bash
npm install
```

Confirm the tree looks correct:

```bash
node -v
npm -v
```

You should see Node ≥ 20 and a modern npm. The repo root must contain `package.json`, `.env.example`, `app/`, `supabase/migrations/`, and `sdk/`.

---

## 2. Configure environment (`.env.local`)

```bash
cp .env.example .env.local
```

On Windows PowerShell (if `cp` is unavailable):

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` and **replace every placeholder** with real values:

| Variable | Local value / source | Placeholder examples to replace |
| -------- | -------------------- | ------------------------------- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | — |
| `NEXT_PUBLIC_APP_NAME` | Your product name (default `ZYNTEKSIS`) | — |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` `public` | `your-supabase-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` (secret) | `your-supabase-service-role-key` |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | `sk-your-openai-api-key` |
| `OPENAI_MODEL` | Default `gpt-4o-mini` | — |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) | `re_your-resend-api-key` |
| `EMAIL_FROM` | Verified Resend sender | `ZYNTEKSIS <noreply@your-domain.com>` |
| `CRON_SECRET` | Long random secret (see below) | `generate-a-long-random-secret` |
| `LOG_LEVEL` | `info` recommended | — |

Generate `CRON_SECRET`:

```bash
openssl rand -hex 32
```

Or with Node (works without OpenSSL):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Development note:** OpenAI / Resend / Cron secrets may be left empty so the app can **boot**. Steps below that need AI, email, incidents, or notifications require those values to be set.

Full reference: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

---

## 3. Apply database migrations

Apply every file in `supabase/migrations/` **in numeric order** (`0001` → `0009`). Do not skip files.

| # | File |
| - | ---- |
| 1 | `0001_create_profiles.sql` |
| 2 | `0002_create_projects_and_api_keys.sql` |
| 3 | `0003_create_error_collection.sql` |
| 4 | `0004_create_incidents_notifications_status.sql` |
| 5 | `0005_create_ai_assistant.sql` |
| 6 | `0006_create_workspaces_enterprise.sql` |
| 7 | `0007_notification_center_preferences.sql` |
| 8 | `0008_status_pages_complete.sql` |
| 9 | `0009_settings_profile_preferences.sql` |

### Option A — Supabase SQL Editor (simplest)

1. Open Supabase Dashboard → **SQL Editor**
2. Paste the full contents of `0001_create_profiles.sql` → **Run**
3. Repeat for `0002` … `0009`

### Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref <YOUR_PROJECT_REF>
npx supabase db push
```

Details: [docs/Database.md](docs/Database.md).

Migration `0009` also creates Storage buckets `avatars` and `workspace-logos`. If they are missing after a partial apply, re-run `0009`.

---

## 4. Configure Supabase Auth URLs

Dashboard → **Authentication** → **URL Configuration**:

| Setting | Local value |
| ------- | ----------- |
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |
| | `http://localhost:3000/auth/confirm` |

If **Confirm email** is enabled (Auth → Providers → Email), you must verify the inbox link before login succeeds.

---

## 5. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Health check:

```bash
curl http://localhost:3000/api/health
```

Expected JSON includes `"success":true` and `"status":"ok"`.

Optional quality gates (from repo root):

```bash
npm run typecheck
npm run lint
npm run build
npm run test:smoke
```

---

## 6. First-success checklist (end-to-end)

Complete these steps in order. UI paths match the shipped dashboard routes.

### 6.1 Register / log in

1. Open `/register`.
2. Sign up with a **real email** and password.
3. Confirm email if Supabase requires it.
4. Open `/login` and sign in.
5. You should land on `/dashboard`.

On first signup, the database trigger creates a default workspace for the user (you do not need a separate SQL step).

### 6.2 Create a workspace

1. Use the **workspace switcher** in the dashboard shell.
2. Choose **Create workspace** / **New workspace**.
3. Enter a name and confirm.

You may also keep the auto-created workspace and skip creating an extra one; creating at least one additional workspace verifies the organization flow.

### 6.3 Create a project

1. Open `/projects`.
2. Create a project (name + slug).
3. Confirm it appears in the list.

### 6.4 Generate an API key

1. Open the project’s API keys UI (project detail / keys area under `/projects`).
2. Create a key for environment `development` (or `production` / `staging`).
3. Copy the plaintext key once — format `ZYN-KEY-…`. It is never shown again.

### 6.5 Build the local SDK

`@zynteksis/sdk` is **not published to the public npm registry** with this package. Build it from source:

```bash
cd sdk
npm install
npm run build
cd ..
```

Confirm `sdk/dist/index.js` exists after the build.

### 6.6 Connect the SDK (sample consumer)

In a separate app (or a throwaway Vite/Next sample you create):

```bash
npm install /absolute/path/to/zynteksis/sdk
```

Example (adjust the absolute path):

```bash
# macOS / Linux
npm install "$(pwd)/sdk"

# Windows PowerShell (from repo root)
npm install (Resolve-Path .\sdk).Path
```

Initialize in the browser:

```ts
import { Zynteksis } from "@zynteksis/sdk";

const zyn = new Zynteksis({
  apiKey: "ZYN-KEY-…", // paste the key from step 6.4
  environment: "development",
  release: "1.0.0-local",
  endpoint: "http://localhost:3000",
  heartbeatInterval: 15000, // faster local feedback (optional)
});

zyn.init();
```

Details: [docs/SDK.md](docs/SDK.md).

### 6.7 Verify heartbeat

1. Keep the sample app open so heartbeats are sent.
2. In ZYNTEKSIS, open `/health` for the project.
3. Within about one to two heartbeat intervals, a recent heartbeat should appear.

Manual check without a browser SDK (optional):

```bash
curl -X POST http://localhost:3000/api/sdk/heartbeat \
  -H "Authorization: Bearer ZYN-KEY-…" \
  -H "Content-Type: application/json" \
  -d "{\"environment\":\"development\",\"release\":\"1.0.0-local\"}"
```

Expect HTTP `202` with `"accepted":true`.

### 6.8 Trigger an error

In the sample app:

```ts
zyn.captureException(new Error("Buyer checklist deliberate error"), {
  level: "error",
});
```

Or via HTTP:

```bash
curl -X POST http://localhost:3000/api/sdk/error \
  -H "Authorization: Bearer ZYN-KEY-…" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Buyer checklist deliberate error\",\"type\":\"Error\",\"level\":\"error\",\"environment\":\"development\"}"
```

Expect HTTP `202`.

### 6.9 Verify the error in the dashboard

1. Open `/errors`.
2. Confirm the message **Buyer checklist deliberate error** (or your message) is listed for the project.
3. Open the error detail route `/errors/[id]` if present.

### 6.10 Run an AI analysis

1. Ensure `OPENAI_API_KEY` is set in `.env.local` and restart `npm run dev` if you just added it.
2. Open `/ai`.
3. Select the project (when prompted by the UI).
4. Ask a question grounded in telemetry, for example:  
   `Summarize the latest errors for this project.`
5. Confirm a streamed assistant reply appears.

### 6.11 Create (open) an incident

Incidents are **opened by the monitor cron**, not by a manual “create incident” form. Initial status is always `investigating` (not `open`).

1. Ensure `CRON_SECRET` is set in `.env.local` and restart the dev server.
2. Send at least one heartbeat for the project (step 6.7), then **stop** the sample app / heartbeats.
3. Wait until no heartbeat has been received for **more than 20 minutes** (monitor timeout).
4. Invoke the monitor job:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/monitor
```

PowerShell:

```powershell
curl -H "Authorization: Bearer $env:CRON_SECRET" http://localhost:3000/api/cron/monitor
```

(Or paste the secret literally into the header for a one-off local test.)

5. Open `/incidents` — an outage incident should appear with status **Investigating** and source **monitor**.
6. Open `/incidents/[id]` and post an update if you want to move status through `identified` → `monitoring` → `resolved`.

### 6.12 Verify a notification

Dashboard notifications are written when the **monitor cron** scans events (and when incidents are opened/resolved).

Fastest local proof after creating a project:

1. Create a project (or use one created in the last few minutes).
2. Run the monitor cron (same `curl` as step 6.11).
3. Open `/notifications`.
4. Confirm a **Project created** (type `project_created`) entry appears.

Optional: ingest an error with `"level":"fatal"`, run the monitor cron again, and confirm a **Critical error** notification.

Email channel delivery additionally requires a real `RESEND_API_KEY` and verified `EMAIL_FROM`.

### 6.13 Verify the public status page

1. Open `/status-pages`.
2. Create a status page linked to your project (public).
3. Copy the public URL `/status/<slug>`.
4. Open that URL in a private/incognito window (no login).
5. Confirm the public page loads (HTTP 200).

The status index at `/status` is also available.

---

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------ |
| `Invalid environment variables` | Missing/invalid `.env.local` values |
| Auth redirect errors | Site URL / redirect allow-list mismatch |
| Signup “email is invalid” / rate limit | Use a real inbox; wait if Supabase rate-limited |
| RLS / permission errors | Migrations not fully applied (`0001`–`0009`) |
| `npm install @zynteksis/sdk` 404 | Package is not on public npm — use local `sdk/` path install |
| SDK 401 | Wrong/revoked key or missing `Authorization: Bearer ZYN-KEY-…` |
| AI chat fails | Missing `OPENAI_API_KEY` or model access |
| Cron 401 | Empty/mismatched `CRON_SECRET` |
| No incident after cron | Heartbeat gap still under 20 minutes |
| Invite / email never arrives | Missing Resend key or unverified `EMAIL_FROM` |

---

## Next steps

- Fast path: [BUYER_QUICK_START.md](BUYER_QUICK_START.md)
- Deploy: [docs/Deployment.md](docs/Deployment.md) · root [DEPLOYMENT.md](DEPLOYMENT.md)
- Architecture: [docs/Architecture.md](docs/Architecture.md)
