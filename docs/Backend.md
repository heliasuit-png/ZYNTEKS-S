# Backend

Server-side surface of ZYNTEKSIS: API routes, services, cron, email, and
privileged Supabase access.

## Entry points

| Kind | Location |
| ---- | -------- |
| HTTP API | `app/api/**/route.ts` |
| Auth callbacks | `app/auth/callback`, `app/auth/confirm` |
| Server actions | `features/*/actions.ts` |
| Cron | `app/api/cron/*` → `cron/jobs/*` |
| SDK ingest | `app/api/sdk/*` → `monitoring/` |

Full HTTP catalog: [API.md](./API.md).

## Service layer

Domain logic lives under `services/` and is generally imported with
`import "server-only"` where privilege matters.

| Area | Path |
| ---- | ---- |
| Auth helpers | `services/auth/` |
| Profiles / account plans | `services/profile/`, `services/account/` |
| Projects | `services/projects/` |
| API keys | `services/api-keys/` |
| Workspace RBAC | `services/workspace/` |
| Errors / health / incidents | `services/dashboard/`, `services/health/`, `services/incidents/` |
| Monitoring engine | `services/monitoring/` |
| Status pages | `services/status/` |
| Notifications | `services/notifications/` |
| AI | `services/ai/` |
| Intelligence / insights | `services/intelligence/` |
| Billing | `services/billing/` |

**Pattern:** inject a `TypedSupabaseClient` (user or admin). Map PostgREST
errors with `lib/map-postgrest-error.ts`. Throw `AppError` subclasses from
`lib/errors.ts`; route helpers in `lib/api-response.ts` serialize them.

## Authentication & authorization

| Mode | Mechanism |
| ---- | --------- |
| Session | Supabase Auth cookies; `requireApiUser` / middleware |
| API key | SHA-256 lookup via service role (`authenticateApiKey`) |
| Cron | `Authorization: Bearer <CRON_SECRET>` |
| Workspace RBAC | `services/workspace/permissions.ts` |

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Admin client:
`supabase/admin.ts`.

## Validation

- Zod schemas at feature boundaries (`features/*/schemas.ts`)
- SDK payloads: `monitoring/schemas.ts`
- Env: `lib/env.ts`

## Rate limiting

In-memory limiter in `lib/rate-limit.ts` (single-instance). Used for SDK
ingest and selected mutations. For multi-region production, replace with Redis
(or similar) without changing call sites’ semantics.

## Cron jobs

Defined in `vercel.json` and registered in `cron/`:

| Job | Path | Schedule |
| --- | ---- | -------- |
| Health | `/api/cron/health` | `*/15 * * * *` |
| Monitor | `/api/cron/monitor` | `* * * * *` |

Monitor pass: outage detection, auto-resolve, notification queue flush.

## Email

Resend client under `emails/`. Invite delivery and transactional templates live
in `emails/templates/`. Requires `RESEND_API_KEY` + verified `EMAIL_FROM`.

## Logging & errors

- `lib/logger.ts` — level from `LOG_LEVEL`
- Operational errors → `AppError` with HTTP status + machine code
- Unexpected errors → sanitized 500 responses (no stack leak to clients)

## Related docs

[API.md](./API.md) · [Database.md](./Database.md) · [Monitoring.md](./Monitoring.md) · [Workspace.md](./Workspace.md)
