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

```ts
import { Zynteksis } from "@zynteksis/sdk";

const zyn = new Zynteksis({
  apiKey: "ZYN-KEY-XXXXXXXXXXXXXXXXXXXXXXXX",
  environment: "development",
  release: "1.0.0",
  // Point at your ZYNTEKSIS host when the consumer app is not same-origin.
  endpoint: "http://localhost:3000",
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

React, Next.js and vanilla JavaScript are supported today. The collector
architecture is framework-agnostic, leaving room for Vue and Angular
integrations.

## Reliability

Failed requests are retried with exponential backoff and persisted to an
offline queue in `localStorage`, then replayed automatically when connectivity
is restored.
