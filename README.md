# ZYNTEKSIS

**Version 1.0.0** — commercial SaaS source-code package.

**Enterprise-grade observability and operations platform** — error monitoring,
health heartbeats, incidents, public status pages, multi-tenant workspaces,
and an AI assistant — delivered as a complete Next.js + Supabase source package.

Release materials: [CHANGELOG.md](CHANGELOG.md) · [RELEASE_NOTES.md](RELEASE_NOTES.md) · [VERSION.md](VERSION.md) · [Final report](docs/FINAL_ENGINEERING_REPORT.md)

> A new engineering team should be able to obtain the source (Git or zip),
> configure, migrate, deploy, and understand the architecture within
> **~30 minutes** using [BUYER_QUICK_START.md](BUYER_QUICK_START.md), this
> README, and the [`docs/`](docs/) guides.

---

## Table of contents

- [Project overview](#project-overview)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Folder structure](#folder-structure)
- [Features](#features)
- [Installation](#installation)
- [Deployment](#deployment)
- [Environment variables](#environment-variables)
- [Screenshots](#screenshots)
- [Documentation map](#documentation-map)
- [Buyer quick start](BUYER_QUICK_START.md)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Scripts](#scripts)
- [License](#license)

---

## Project overview

ZYNTEKSIS is a self-hostable SaaS control plane for application reliability:

| Capability | Description |
| ---------- | ----------- |
| **SDK ingest** | Browser SDK sends errors, events, performance, and heartbeats |
| **Dashboard** | Projects, API keys, errors, health, incidents, insights |
| **Workspaces** | Multi-tenant orgs with RBAC, invites, audit logs |
| **Status pages** | Public `/status/[slug]` with components & maintenance |
| **AI assistant** | Streaming OpenAI chat grounded in project telemetry |
| **Billing hooks** | Plan catalog + pluggable `PaymentProvider` (placeholder shipped) |

**Who maintains what**

| Layer | Location |
| ----- | -------- |
| HTTP / pages | `app/` |
| Domain UI | `features/` |
| Business logic | `services/` |
| Shared infra | `lib/`, `supabase/`, `monitoring/`, `cron/` |
| Client SDK | `sdk/` |

Deep dive: [docs/Architecture.md](docs/Architecture.md).

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  app/            Thin routes, layouts, API handlers         │
├─────────────────────────────────────────────────────────────┤
│  features/       Isolated product modules (UI + actions)    │
├─────────────────────────────────────────────────────────────┤
│  services/       Domain logic (no React)                    │
├─────────────────────────────────────────────────────────────┤
│  monitoring/ cron/ ai/ emails/                              │
│  Ingest pipeline, jobs, OpenAI, Resend                      │
├─────────────────────────────────────────────────────────────┤
│  lib/  supabase/  components/  utils/  types/               │
│  Shared infrastructure & UI primitives                      │
└─────────────────────────────────────────────────────────────┘
```

**Dependency rule:** features never import other features for shared UI —
use `components/`, `lib/`, `services/`, or `utils/` instead.

**Three auth modes**

1. **Session** (Supabase cookie) — dashboard APIs & server actions  
2. **API key** (`ZYN-KEY-…`) — SDK ingest  
3. **Cron secret** — `/api/cron/*`

---

## Technology stack

| Layer | Technology |
| ----- | ---------- |
| Runtime | Node.js ≥ 20 |
| App | Next.js 15 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database / Auth / Storage | Supabase (PostgreSQL, Auth, Storage) |
| AI | OpenAI API |
| Email | Resend |
| Cron / Hosting | Vercel Cron + Vercel (recommended) |
| Validation | Zod |
| Client SDK | `@zynteksis/sdk` (`sdk/`) |

---

## Folder structure

```text
.
├── app/                 # App Router (marketing, auth, dashboard, API)
├── features/            # Feature modules (ai, auth, billing, errors, …)
├── services/            # Domain services (server-only where needed)
├── components/          # Shared UI (dashboard shell, markdown, billing)
├── lib/                 # Env, errors, rate-limit, constants, helpers
├── hooks/               # Shared React hooks
├── middleware/          # Auth gating building blocks
├── supabase/            # Clients + SQL migrations
├── monitoring/          # SDK ingest HTTP + persistence
├── cron/                # Scheduled job registry
├── ai/                  # OpenAI client factory
├── emails/              # Resend templates
├── sdk/                 # Browser SDK (build locally; not on public npm)
├── types/               # Generated / shared TypeScript types
├── utils/               # Pure helpers
├── scripts/             # Optional DB helpers
├── docs/                # Maintainer documentation (start here)
├── .env.example         # Environment template (no secrets)
└── vercel.json          # Cron schedules
```

---

## Features

- Authentication (login, register, password reset, PKCE callbacks)
- Workspaces, members, invitations, audit, security sessions
- Projects & hashed API keys
- SDK error / event / performance / heartbeat ingest
- Error explorer, health monitor, incidents, insights
- Notification center + preferences
- Public status pages
- AI workspace chat (streaming NDJSON)
- Settings (profile, appearance, AI preferences)
- Billing UI with **placeholder** payment provider
- Marketing site (`/`, `/pricing`, `/docs`, legal pages)

---

## Installation

**Fast path (≈30 minutes):** [BUYER_QUICK_START.md](BUYER_QUICK_START.md)  
**Full first-success checklist:** [INSTALL.md](INSTALL.md)

### Repository setup

Use **exactly one** of the following, depending on how the commercial package was delivered.

**A. Git remote provided by the seller**

```bash
git clone <REPLACE_WITH_YOUR_REPOSITORY_URL> zynteksis
cd zynteksis
npm install
```

`<REPLACE_WITH_YOUR_REPOSITORY_URL>` is the private Git URL from your license or delivery email. There is no public default clone URL for this package.

**B. Zip / folder delivery (no Git)**

1. Extract the archive so the working directory contains `package.json`, `.env.example`, `app/`, `supabase/`, and `sdk/`.
2. From that directory:

```bash
npm install
```

### Configure, migrate, run

```bash
# Environment (replace every placeholder — see .env.example comments)
cp .env.example .env.local

# Database — apply supabase/migrations/0001 … 0009 in order
# (Supabase SQL Editor or CLI) — see docs/Database.md

# Auth URLs (Supabase → Authentication → URL Configuration)
# Site URL: http://localhost:3000
# Redirect: http://localhost:3000/auth/callback
#           http://localhost:3000/auth/confirm

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Confirm `GET /api/health` returns OK.

### First-success path (summary)

1. Register / log in (`/register`, `/login`) — use a real email  
2. Create a workspace (workspace switcher) or use the auto-created one  
3. Create a project (`/projects`)  
4. Generate an API key (`ZYN-KEY-…`)  
5. Build the **local** SDK: `cd sdk && npm install && npm run build`  
6. Path-install into a sample app: `npm install /absolute/path/to/zynteksis/sdk`  
7. Confirm heartbeat (`/health`) and an error (`/errors`)  
8. Run AI analysis (`/ai`)  
9. Open an incident via monitor cron after heartbeat timeout (`/incidents`)  
10. Verify notifications (`/notifications`) and a public status page (`/status/<slug>`)  

Do **not** run `npm install @zynteksis/sdk` from the public registry — the package is not published there. Details: [docs/SDK.md](docs/SDK.md).

---

## Deployment

Recommended: **Supabase** (DB/Auth/Storage) + **Vercel** (Next.js + Cron).

1. Apply migrations `0001`–`0009`  
2. Set production env vars from [`.env.example`](.env.example) — **replace every placeholder**  
3. Configure Auth redirect URLs for your domain  
4. Deploy; confirm `vercel.json` crons and matching `CRON_SECRET`  
5. Smoke-test `/api/health`, login, SDK heartbeat  

Guides: [DEPLOYMENT.md](DEPLOYMENT.md) · [docs/Deployment.md](docs/Deployment.md).

---

## Environment variables

Copy [`.env.example`](.env.example) → `.env.local`. Never commit secrets.

| Variable | Required (prod) | Purpose |
| -------- | --------------- | ------- |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical public URL |
| `NEXT_PUBLIC_APP_NAME` | Yes | Product display name |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only service role |
| `OPENAI_API_KEY` | Yes | AI assistant |
| `OPENAI_MODEL` | Yes | Default `gpt-4o-mini` |
| `RESEND_API_KEY` | Yes | Transactional email |
| `EMAIL_FROM` | Yes | Verified From header |
| `CRON_SECRET` | Yes | Cron route auth |
| `LOG_LEVEL` | No | `debug` \| `info` \| `warn` \| `error` |

Full reference: [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md).

---

## Screenshots

Add images under [`docs/screenshots/`](docs/screenshots/) (see naming guide there).

| Area | Placeholder |
| ---- | ----------- |
| Landing | `docs/screenshots/landing.png` |
| Dashboard | `docs/screenshots/dashboard.png` |
| Errors | `docs/screenshots/errors.png` |
| Health | `docs/screenshots/health.png` |
| AI | `docs/screenshots/ai.png` |
| Status | `docs/screenshots/status.png` |

<!-- Example once files exist:
![Dashboard overview](docs/screenshots/dashboard.png)
-->

---

## Documentation map

| Guide | Path |
| ----- | ---- |
| Buyer quick start (≈30 min) | [BUYER_QUICK_START.md](BUYER_QUICK_START.md) |
| Full install + first-success | [INSTALL.md](INSTALL.md) |
| Architecture | [docs/Architecture.md](docs/Architecture.md) |
| Backend | [docs/Backend.md](docs/Backend.md) |
| Frontend | [docs/Frontend.md](docs/Frontend.md) |
| Database | [docs/Database.md](docs/Database.md) |
| HTTP API | [docs/API.md](docs/API.md) |
| SDK (local package) | [docs/SDK.md](docs/SDK.md) |
| AI | [docs/AI.md](docs/AI.md) |
| Monitoring | [docs/Monitoring.md](docs/Monitoring.md) |
| Workspace | [docs/Workspace.md](docs/Workspace.md) |
| Billing | [docs/Billing.md](docs/Billing.md) |
| Deployment | [docs/Deployment.md](docs/Deployment.md) · [DEPLOYMENT.md](DEPLOYMENT.md) |
| Docs index | [docs/README.md](docs/README.md) |
| Documentation verification | [docs/DOCUMENTATION_VERIFICATION_REPORT.md](docs/DOCUMENTATION_VERIFICATION_REPORT.md) |

---

## FAQ

**Is payment processing included?**  
UI and plan limits ship; the payment provider is a **placeholder**. Wire Stripe/Paddle via `services/billing/factory.ts` — see [docs/Billing.md](docs/Billing.md).

**Where is the SDK published?**  
It is **not** published to the public npm registry with this package. Source lives in `sdk/`. Build with `cd sdk && npm install && npm run build`, then path-install into consuming apps (`npm install /absolute/path/to/zynteksis/sdk`). You may publish to a **private** registry later under your own scope if desired.

**Can I skip OpenAI / Resend locally?**  
Yes in development (`lib/env.ts` relaxes those secrets). Production requires them.

**How are API keys stored?**  
Only SHA-256 hashes. Plaintext is shown once at create/regenerate.

**Do features import each other?**  
No. Shared UI belongs in `components/` or `utils/`.

**Is there a Supabase `config.toml`?**  
Not committed. Apply SQL via Dashboard or CLI after linking a project.

---

## Troubleshooting

| Symptom | Likely fix |
| ------- | ---------- |
| `Invalid environment variables` | Complete `.env.local`; see env docs |
| Auth redirect errors | Fix Site URL + redirect allow-list in Supabase |
| RLS / permission errors | Re-apply migrations `0001`–`0009` in order |
| SDK 401 | Wrong key, revoked key, or missing `Authorization` / `X-Zynteksis-Key` |
| Cron 401 | `CRON_SECRET` mismatch or empty |
| AI chat fails | Set `OPENAI_API_KEY` / model access |
| Invites never arrive | Resend key + verified `EMAIL_FROM` domain |
| Build fails types/lint | `npm run typecheck` / `npm run lint` — both enforced in production build |

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:smoke` | Minimal smoke tests |
| `npm run format` | Prettier write |

---

## License

Sold / distributed as a commercial source-code package. Ownership and
redistribution terms are defined by your purchase or license agreement.
