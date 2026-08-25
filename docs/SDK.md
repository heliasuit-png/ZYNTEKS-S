# SDK (`@zynteksis/sdk`)

Browser telemetry SDK for ZYNTEKSIS. Source: [`sdk/`](../sdk/).

Also see package readme: [`sdk/README.md`](../sdk/README.md).

> **Not on public npm.** This commercial package does **not** ship
> `@zynteksis/sdk` to the public npm registry. Always build from `sdk/` and
> install via a local path (or your private registry after you publish it).

---

## Installation (local development)

From the ZYNTEKSIS repository root:

```bash
cd sdk
npm install
npm run build
cd ..
```

Confirm the build output exists: `sdk/dist/index.js`.

### Consume from another application

Install the built package by path (use an **absolute** path):

```bash
npm install /absolute/path/to/zynteksis/sdk
```

Examples:

```bash
# From the ZYNTEKSIS repo root (macOS / Linux)
npm install "$(pwd)/sdk"

# Windows PowerShell (from ZYNTEKSIS repo root)
npm install (Resolve-Path .\sdk).Path
```

Package name remains `@zynteksis/sdk`, so imports stay the same after a path install.

Optional later step (buyer-owned): publish the contents of `sdk/` to **your**
private npm registry, then install from that registry. Do not expect
`npm install @zynteksis/sdk` to work against registry.npmjs.org for this delivery.

---

## Configuration

```ts
import { Zynteksis } from "@zynteksis/sdk";

const zyn = new Zynteksis({
  apiKey: "ZYN-KEY-XXXXXXXXXXXXXXXXXXXXXXXX",
  environment: "production", // production | staging | development
  release: "1.2.3",
  // Required when the consumer app is not same-origin with ZYNTEKSIS.
  endpoint: "https://zynteksisv.vercel.app",
});

zyn.init();
```

> **Security:** Use only a project `ZYN-KEY-…` from **API Keys**. Never use
> Supabase `service_role`, anon keys, or database passwords in the SDK or browser.

### Server / Node

`init()` is browser-only. POST to ingest with `X-Zynteksis-Key` (or
`Authorization: Bearer`):

| Kind | Path |
| ---- | ---- |
| error | `/api/sdk/error` |
| heartbeat | `/api/sdk/heartbeat` |
| performance | `/api/sdk/performance` |
| events | `/api/sdk/events` |

### Native mobile (React Native / iOS / Android)

Do **not** use `@zynteksis/sdk` `init()` in React Native or other native mobile
runtimes — it is a browser SDK (DOM / `window` / `localStorage` assumptions).

Use the HTTP ingest API with your project API key:

```http
POST /api/sdk/heartbeat
X-Zynteksis-Key: ZYN-KEY-…
Content-Type: application/json
```

Same paths as Server / Node above. Keep the key in secure native storage (or a
backend proxy); never embed platform secrets in the app binary.

```ts
await fetch("https://zynteksisv.vercel.app/api/sdk/heartbeat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Zynteksis-Key": process.env.ZYNTEKSIS_API_KEY!,
  },
  body: JSON.stringify({ environment: "production", release: "1.0.0" }),
});
```

| Option | Default | Description |
| ------ | ------- | ----------- |
| `apiKey` | — | **Required.** `ZYN-KEY-…` |
| `environment` | `"production"` | Tag for filtering |
| `release` | — | App version string |
| `endpoint` | `""` | ZYNTEKSIS origin; empty = same origin |
| `enabled` | `true` | Master switch |
| `debug` | `false` | Verbose SDK logs |
| `sampleRate` | `1` | Error sampling 0–1 |
| `heartbeatInterval` | `60000` | Heartbeat interval (ms) |
| `maxQueueSize` | `50` | Offline queue size |
| `maxPayloadBytes` | `256KB` | Client-side payload cap |
| `compress` | `true` | Gzip when supported |
| `captureConsole` | `true` | Capture `console.error` |
| `captureNetwork` | `true` | Failed fetch / 5xx |
| `captureResources` | `true` | Resource load errors |
| `capturePerformance` | `true` | Web Vitals |
| `captureHeartbeat` | `true` | Periodic heartbeats |
| `axios` | — | Optional Axios instance |
| `beforeSend` | — | Mutate/drop error payloads |

`init()` is **browser-only**. It no-ops when `enabled: false`, already started,
or running outside a browser.

---

## Heartbeat

With `captureHeartbeat: true`, the SDK posts to `/api/sdk/heartbeat` every
`heartbeatInterval` milliseconds.

Payload may include memory, uptime, page URL, environment, release.

**Verify:** dashboard → `/health` for the project within about one to two intervals.

---

## Error capture

Automatic: `window` errors, unhandled rejections, optional console/network/resource collectors.

Manual:

```ts
zyn.captureException(new Error("Payment failed"), { level: "error" });
zyn.captureMessage("Checkout completed", "info");
```

Ingest: `POST /api/sdk/error`. Server may mark `deduped: true` for fingerprint matches.

Valid levels align with the database `event_level` enum:
`debug`, `info`, `warning`, `error`, `fatal`.

### React boundary

```tsx
import { ErrorBoundary } from "@zynteksis/sdk/react";

<ErrorBoundary fallback={<p>Something went wrong.</p>}>
  <App />
</ErrorBoundary>;
```

---

## Performance

When `capturePerformance` is enabled, Web Vitals / navigation metrics go to
`/api/sdk/performance`.

---

## Custom events

```ts
zyn.captureEvent({
  type: "user.action",
  name: "upgrade_clicked",
  level: "info",
  metadata: { plan: "pro" },
});
```

Batched to `/api/sdk/events`.

---

## Environment & release

Always set `environment` and `release` in production builds so the dashboard
can filter incidents and errors by deploy.

`environment` values match `api_key_environment`: `production`, `staging`,
`development`.

---

## Reliability

- Retries with exponential backoff  
- Offline queue in `localStorage`, flushed automatically on reconnect  
- Call `zyn.close()` on teardown if you need to stop collectors  

---

## Project isolation

Every API key belongs to **one project**. Ingest always attributes telemetry to
that project — client payloads cannot redirect data into another project by
sending a foreign `projectId`.

---

## Rate limits

SDK ingest routes share an in-memory limiter (default **240 requests / minute /
key**). See `SDK_INGEST.rateLimit` in `lib/constants.ts` and payload schemas in
[API.md](./API.md). On `429`, back off and retry.

---

## Troubleshooting

| Symptom | What to check |
| -------- | ------------- |
| `401` on ingest | Key missing, mistyped, or revoked — create/regenerate on **API Keys** |
| No rows in dashboard | Wrong `endpoint`, wrong project key, or filters excluding the environment |
| Browser CORS errors | Call the hosted ZYNTEKSIS origin; ingest routes enable CORS for browser SDK |
| `init()` does nothing on Node | Expected — use raw HTTP with `X-Zynteksis-Key` on the server |
| Install fails from npm registry | Package is path-installed from `sdk/` for commercial delivery |

---

## Best practices

1. Create a **dedicated API key** per environment (prod/staging)  
2. Never embed service-role Supabase keys in the SDK  
3. Point `endpoint` at the ZYNTEKSIS origin in cross-origin apps  
4. Use `beforeSend` to strip PII (emails, tokens) before upload  
5. Keep `sampleRate < 1` only if volume requires it  
6. Rotate keys via the dashboard regenerate flow if leaked  
7. Prefer the React error boundary around route trees  

---

## Auth headers (raw HTTP)

If you bypass the SDK:

```http
Authorization: Bearer ZYN-KEY-...
Content-Type: application/json
```

Alternate header: `X-Zynteksis-Key: ZYN-KEY-...`

See [API.md](./API.md) for payload schemas.
