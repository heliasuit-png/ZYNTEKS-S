# @zynteksis/sdk

Error monitoring, performance and telemetry SDK for ZYNTEKSIS. Automatically
captures JavaScript errors, unhandled rejections, network/axios failures,
resource load errors, `console.error`, Web Vitals and periodic heartbeats, then
ships them to the ZYNTEKSIS ingestion API authenticated by your project API key.

> **Local package.** This SDK is **not published** to the public npm registry
> with the commercial ZYNTEKSIS delivery. Build it from this folder and install
> it into consumer apps by path. Canonical guide: [`docs/SDK.md`](../docs/SDK.md).

## Build (required)

From this `sdk/` directory:

```bash
npm install
npm run build
```

Output: `dist/index.js` (and React entry under `dist/react/`).

## Install into a consumer application

```bash
npm install /absolute/path/to/zynteksis/sdk
```

Examples from the ZYNTEKSIS repository root:

```bash
# macOS / Linux
npm install "$(pwd)/sdk"

# Windows PowerShell
npm install (Resolve-Path .\sdk).Path
```

After a path install, import as `@zynteksis/sdk` (the package `name` field).

## Usage

> **Security:** `apiKey` must be a project key from the ZYNTEKSIS **API Keys**
> page (`ZYN-KEY-…`). It is **not** a Supabase `service_role` key, anon key, or
> database password. Never put platform secrets in browser bundles.

```ts
import { Zynteksis } from "@zynteksis/sdk";

const zyn = new Zynteksis({
  apiKey: "ZYN-KEY-XXXXXXXXXXXXXXXXXXXXXXXX",
  environment: "production",
  release: "1.0.0",
  // Required when the consumer app is not same-origin with ZYNTEKSIS.
  endpoint: "https://zynteksisv.vercel.app",
});

zyn.init();
```

Once initialized the SDK captures errors, performance metrics and heartbeats
automatically. You can also report manually:

```ts
zyn.captureException(new Error("Something broke"));
zyn.captureMessage("Checkout completed", "info");
zyn.captureEvent({ type: "user.action", name: "upgrade_clicked" });
```

### Auth header

The transport sends `X-Zynteksis-Key: <apiKey>`. The server also accepts
`Authorization: Bearer <apiKey>`.

Ingest paths (relative to `endpoint`):

| Kind | Path |
| ---- | ---- |
| error | `/api/sdk/error` |
| heartbeat | `/api/sdk/heartbeat` |
| performance | `/api/sdk/performance` |
| events | `/api/sdk/events` |

### Server / Node (HTTP)

`init()` is **browser-only** and no-ops on Node. Server-side code should call
the ingest endpoints directly with the same project API key:

```ts
const endpoint = "https://zynteksisv.vercel.app";
const apiKey = process.env.ZYNTEKSIS_API_KEY!; // ZYN-KEY-… only

await fetch(`${endpoint}/api/sdk/heartbeat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Zynteksis-Key": apiKey,
  },
  body: JSON.stringify({ environment: "production", release: "1.0.0" }),
});
```

### React error boundary

```tsx
import { ErrorBoundary } from "@zynteksis/sdk/react";

<ErrorBoundary fallback={<p>Something went wrong.</p>}>
  <App />
</ErrorBoundary>;
```

## Configuration

| Option              | Default        | Description                                     |
| ------------------- | -------------- | ----------------------------------------------- |
| `apiKey`            | —              | Required. `ZYN-KEY-...` project key.            |
| `environment`       | `"production"` | `production` \| `staging` \| `development`.     |
| `release`           | —              | Application version string.                     |
| `endpoint`          | `""`           | Ingestion base URL (empty = same origin).       |
| `enabled`           | `true`         | Master switch.                                  |
| `debug`             | `false`        | Verbose internal logging.                       |
| `sampleRate`        | `1`            | Fraction of errors to send (0–1).               |
| `heartbeatInterval` | `60000`        | Heartbeat interval in ms.                       |
| `compress`          | `true`         | Gzip large payloads when supported.             |
| `captureConsole`    | `true`         | Capture `console.error`.                        |
| `captureNetwork`    | `true`         | Capture fetch failures / 5xx.                   |
| `captureResources`  | `true`         | Capture resource load errors.                   |
| `capturePerformance`| `true`         | Capture Web Vitals & navigation timing.         |
| `captureHeartbeat`  | `true`         | Emit periodic heartbeats.                       |
| `axios`             | —              | Axios instance to attach error interceptors to. |
| `beforeSend`        | —              | Mutate/drop an error payload before sending.    |

## Framework support

React, Next.js and vanilla JavaScript (any **browser** bundler) are supported.
`init()` is browser-only; Vue/Svelte/etc. use the same browser API.

**React Native / native mobile:** do not use `@zynteksis/sdk` `init()`. Call the
HTTP ingest endpoints with `X-Zynteksis-Key` (same as server-side Node). Store
the project API key securely (Keychain / Keystore or a backend proxy).

Server / Node code should call HTTP ingest with `X-Zynteksis-Key`.

## Dashboard monitoring

After ingest succeeds, open the ZYNTEKSIS dashboard → **Errors**, **Health**,
and **Insights** for the connected project. Telemetry is isolated to the
project that owns the API key.

## Rate limits & troubleshooting

Ingest defaults to **240 requests / minute / key**. On `401`, regenerate the
key; on empty dashboards, verify `endpoint` and project filters. See
[`docs/SDK.md`](../docs/SDK.md) for the full troubleshooting table.

## Reliability

Failed requests are retried with exponential backoff and persisted to an
offline queue in `localStorage`, then replayed automatically when connectivity
is restored.
