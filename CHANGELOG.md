# Changelog

All notable changes to ZYNTEKSIS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-08-03

First commercial source-code release. Feature-complete observability SaaS
package for self-hosting and white-label deployment.

### Added

- Next.js 15 App Router product surface (marketing, auth, dashboard)
- Supabase Auth, PostgreSQL schema migrations `0001`–`0009`, Storage buckets
- Multi-tenant workspaces with RBAC, invitations, audit logs, sessions
- Projects and hashed API keys (`ZYN-KEY-…`)
- Browser SDK (`@zynteksis/sdk`) — errors, events, performance, heartbeats
- Error explorer, health monitor, incidents, insights intelligence engine
- Notification center, preferences, Resend email delivery hooks
- Public status pages with components, maintenance, JSON-LD, exports
- AI assistant (OpenAI streaming NDJSON, usage metering, feedback)
- Settings (profile, appearance, AI preferences, API settings)
- Billing architecture with pluggable `PaymentProvider` (placeholder shipped)
- Vercel Cron jobs (`/api/cron/health`, `/api/cron/monitor`)
- Enterprise documentation suite under `docs/` and root README
- Environment template (`.env.example`) with full variable documentation

### Security

- Zod validation at API / SDK boundaries
- RLS on application tables; service-role limited to privileged paths
- API keys stored as SHA-256 hashes only
- Cron authentication via non-empty `CRON_SECRET` (timing-safe compare)
- Env validation; `SKIP_ENV_VALIDATION` forbidden in production
- Security response headers (HSTS, frame deny, nosniff, COOP, …)
- Safe auth redirects (`lib/safe-redirect.ts`)
- In-memory rate limiting on SDK ingest and selected mutations

### Documentation

- README, INSTALL, ENVIRONMENT_VARIABLES
- `docs/Architecture`, Backend, Frontend, Database, API, SDK, AI, Monitoring,
  Workspace, Billing, Deployment
- Commercial delivery and engineering quality audit reports

### Known limitations (intentional)

- Payment provider is a placeholder (no Stripe/Paddle bundled)
- Rate limits are process-local (swap for Redis in multi-instance deploys)
- SDK must be built/published from `sdk/` by the buyer
- No automated SQL down-migrations (forward-fix strategy)

[1.0.0]: https://github.com/example/zynteksis/releases/tag/v1.0.0
