# HTTP API

Base URL = your deployment origin (e.g. `https://app.example.com`).

Shared helpers: `lib/api-response.ts`, `monitoring/http.ts`, `cron/auth.ts`.

---

## Authentication

| Mode | How to send | Used by |
| ---- | ----------- | ------- |
| **Session** | Supabase auth cookies (same-origin browser / server) | Dashboard APIs, exports, AI |
| **API key** | `Authorization: Bearer ZYN-KEY-…` **or** `X-Zynteksis-Key: ZYN-KEY-…` | `/api/sdk/*` |
| **Cron** | `Authorization: Bearer <CRON_SECRET>` | `/api/cron/*` |
| **Public** | None | `/api/health`, status export |

---

## Response envelopes

**Session / cron JSON (typical)**

```json
{ "success": true, "data": { } }
```

```json
{ "success": false, "error": { "code": "BAD_REQUEST", "message": "…" } }
```

**SDK ingest**

- Success: HTTP **202** `{ "success": true, "data": { … } }`
- Failure: `{ "success": false, "error": { "code", "message" } }`

**Exports** may return raw CSV/JSON downloads or `{ "error": "Unauthorized" }` on 401.

**Workspace search** returns `{ "items": SearchHit[] }` (not the `ok()` envelope).

---

## Public

### `GET /api/health`

Liveness probe.

**Response 200**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "zynteksis",
    "timestamp": "<iso>"
  }
}
```

### `GET /api/status/[slug]/export`

Public status export (service role + app filters).

| Query | Values |
| ----- | ------ |
| `format` | `csv` (default) \| `json` |

**404** `{ "error": "Not found" }`

---

## Cron (`CRON_SECRET`)

### `GET /api/cron/health`

Runs platform health job. **401** if secret missing/invalid.

### `GET /api/cron/monitor`

Runs monitoring pass + notification queue (`maxDuration` elevated). **401** if unauthorized.

---

## SDK ingest (`API key`)

All support `OPTIONS` (CORS 204) and `POST`. Bodies may be gzip-encoded.
Schemas: `monitoring/schemas.ts`. Limits: `SDK_INGEST` in `lib/constants.ts`
(~240 req/min/project; payload size caps).

### Common headers

```http
Authorization: Bearer ZYN-KEY-<key>
Content-Type: application/json
Content-Encoding: gzip   # optional
```

### `POST /api/sdk/heartbeat`

**Body (selected fields):** `timestamp?`, `memory?`, `uptime?`, `page?`,
`environment?`, `release?`

**202:** `{ "success": true, "data": { "accepted": true } }`

### `POST /api/sdk/error`

**Body:** `message` (required), plus optional `stack`, `type`, `level`, `url`,
browser/os/device/screen, `environment`, `release`, `performance`, `network`,
`memory`, `timestamp`.

**202:** `{ "success": true, "data": { "accepted": true, "deduped": <bool> } }`

### `POST /api/sdk/events`

**Body:** `{ environment?, release?, events: Event[] }`  
Each event: `type` (required), `name?`, `level?`, `message?`, `url?`,
`metadata?`, `timestamp?`  
Max events per request: configured constant.

**202:** `{ "success": true, "data": { "accepted": <count> } }`

### `POST /api/sdk/performance`

**Body:** `url?`, Web Vital fields (`pageLoad`, `fcp`, `lcp`, `cls`, `inp`,
`ttfb`, `navigation?`), `environment?`, `release?`, `timestamp?`

**202:** `{ "success": true, "data": { "accepted": true } }`

**Errors:** `401` invalid/missing key · `413` payload too large · `429` rate
limited · `400` validation.

---

## Session — projects

### `GET /api/projects`

Query: `page`, `pageSize`, `search`, `status`.

### `POST /api/projects`

Body: `name`, optional `slug`, `description`, `framework`, `productionUrl`,
`stagingUrl`. Rate limited.

### `GET|PATCH|DELETE /api/projects/[id]`

PATCH fields: `name`, `description`, `framework`, `status`, URLs.  
DELETE returns `{ id }`.

---

## Session — API keys

### `GET /api/api-keys`

Query: `projectId`, `environment`, `status` (`active`|`revoked`), `search`,
pagination.

### `POST /api/api-keys`

Body: `projectId` (uuid), `name` (1–60), `environment`.  
Returns plaintext key **once**. Rate limited.

### `GET /api/api-keys/[id]`

### `POST /api/api-keys/[id]/revoke`

### `POST /api/api-keys/[id]/regenerate`

Regenerate returns a new plaintext key once.

---

## Session — AI

### `POST /api/ai/chat`

Body: optional `conversationId`, `projectId`, `message`, `regenerate`
(default `false`). Message required unless regenerating.

**Response:** `application/x-ndjson` stream (`meta` / `delta` / `done` / `error`
events). JSON `fail()` on hard errors.

---

## Session — workspace search

### `GET /api/workspace/search`

Query: `q` (max 128), `workspaceId`. Requires membership.

**200:** `{ "items": [ { id, label, href, group, keywords? } ] }`

---

## Session — exports

| Endpoint | Query highlights | Output |
| -------- | ---------------- | ------ |
| `GET /api/errors/export` | `q`, `projectId`, `environment`, `level`, `release`, `activity`, `from`, `to` | CSV |
| `GET /api/incidents/export` | filters + `format` | CSV/JSON |
| `GET /api/health-monitor/export` | filters + `format` | CSV/JSON |

Unauthorized → `401` JSON `{ "error": "Unauthorized" }`.

---

## Error codes

Machine codes come from `ERROR_CODE` in `lib/constants.ts` (e.g.
`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`,
`INTERNAL`). Prefer handling `error.code` over string matching messages.

---

## Server actions

Most dashboard mutations use Next.js **server actions** under
`features/*/actions.ts` rather than REST. Treat REST above as the public /
SDK / export / cron surface; actions are the primary UI mutation API.

---

## Related

[SDK.md](./SDK.md) · [Backend.md](./Backend.md) · [Monitoring.md](./Monitoring.md)
