import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

describe("vercel cron configuration", () => {
  it("wires health + monitor schedules matching the job registry", () => {
    const raw = readFileSync(resolve(process.cwd(), "vercel.json"), "utf8");
    const json = JSON.parse(raw) as {
      crons?: Array<{ path?: string; schedule?: string }>;
    };
    const crons = json.crons ?? [];
    assert.equal(crons.length, 2);

    const health = crons.find((c) => c.path === "/api/cron/health");
    const monitor = crons.find((c) => c.path === "/api/cron/monitor");
    // Hobby plan allows at most one run per day per cron.
    assert.equal(health?.schedule, "0 0 * * *");
    assert.equal(monitor?.schedule, "0 1 * * *");
  });

  it("does not expose CRON_SECRET as a NEXT_PUBLIC_ variable in .env.example", () => {
    const example = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
    assert.equal(/NEXT_PUBLIC_CRON_SECRET\s*=/.test(example), false);
    assert.match(example, /^CRON_SECRET=/m);
  });
});
