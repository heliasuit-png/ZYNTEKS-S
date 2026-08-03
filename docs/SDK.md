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
  environment: "development", // production | staging | development
  release: "1.2.3",
  endpoint: "http://localhost:3000", // required when the app is not same-origin
});

zyn.init();
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
- Offline queue in `localStorage`, flushed on reconnect (`flushOffline`)  
- Call `zyn.close()` on teardown if you need to stop collectors  

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
