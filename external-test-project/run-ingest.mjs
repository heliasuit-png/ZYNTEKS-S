/**
 * External disposable client — proves another project can call ZYNTEKSIS ingest
 * using the same contract as @zynteksis/sdk.
 *
 * Safety:
 * - Refuses production app host (zynteksisv.vercel.app)
 * - Requires STAGING_BASE_URL (or INTEGRATION_BASE_URL) + INTEGRATION_API_KEY
 * - Never prints the API key
 * - Staging disposable keys only
 */

import { Zynteksis } from "@zynteksis/sdk";

const PRODUCTION_HOSTS = new Set([
  "zynteksisv.vercel.app",
  "zynteks-s.vercel.app",
  "zynteksisv1.vercel.app",
]);

function hostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

const baseUrl = (
  process.env.STAGING_BASE_URL ||
  process.env.INTEGRATION_BASE_URL ||
  ""
).replace(/\/+$/, "");
const apiKey = process.env.INTEGRATION_API_KEY || "";

if (!baseUrl || !apiKey) {
  console.log(
    "EXTERNAL_SDK: BLOCKED — set STAGING_BASE_URL and INTEGRATION_API_KEY (staging disposable key only)",
  );
  process.exit(0);
}

const host = hostname(baseUrl);
if (!host || PRODUCTION_HOSTS.has(host)) {
  console.log("EXTERNAL_SDK: BLOCKED — production target refused");
  process.exit(2);
}

// Prove package import works (constructor only; init() is browser-gated)
const client = new Zynteksis({
  apiKey,
  environment: "development",
  release: "external-test-project",
  endpoint: baseUrl,
  enabled: false,
});
void client;

async function post(path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Zynteksis-Key": apiKey,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, ok: res.status === 202 };
}

const results = [];

results.push([
  "heartbeat",
  await post("/api/sdk/heartbeat", {
    uptime: 1.5,
    environment: "development",
    release: "external-test-project",
  }),
]);

results.push([
  "error",
  await post("/api/sdk/error", {
    message: "external-test-project disposable error",
    environment: "development",
    release: "external-test-project",
  }),
]);

results.push([
  "performance",
  await post("/api/sdk/performance", {
    environment: "development",
    release: "external-test-project",
    lcp: 1200,
    cls: 0.01,
    inp: 50,
  }),
]);

results.push([
  "events",
  await post("/api/sdk/events", {
    environment: "development",
    release: "external-test-project",
    events: [
      {
        type: "test",
        name: "external_sdk_ping",
        timestamp: new Date().toISOString(),
      },
    ],
  }),
]);

const failed = results.filter(([, r]) => !r.ok);
for (const [name, r] of results) {
  console.log(`EXTERNAL_SDK ${name}: ${r.ok ? "PASS" : "FAIL"} (HTTP ${r.status})`);
}

if (failed.length) {
  console.log("EXTERNAL_SDK: FAIL");
  process.exit(1);
}

console.log("EXTERNAL_SDK: PASS");
