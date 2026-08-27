/**
 * Structural: connection UX + SDK docs must match real ingest contract.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

import { dictionaries } from "@/lib/i18n/dictionaries";

const guide = readFileSync(
  resolve(process.cwd(), "features/api-keys/components/connection-guide.tsx"),
  "utf8",
);
const installer = readFileSync(
  resolve(process.cwd(), "components/dashboard/sdk/sdk-installer.tsx"),
  "utf8",
);
const apiKeysPage = readFileSync(
  resolve(process.cwd(), "app/(dashboard)/api-keys/page.tsx"),
  "utf8",
);
const sdkReadme = readFileSync(resolve(process.cwd(), "sdk/README.md"), "utf8");
const reveal = readFileSync(
  resolve(process.cwd(), "features/api-keys/components/reveal-key-modal.tsx"),
  "utf8",
);
const constants = readFileSync(
  resolve(process.cwd(), "lib/constants.ts"),
  "utf8",
);
const guard = readFileSync(
  resolve(process.cwd(), "tests/integration/setup/guard.ts"),
  "utf8",
);
const envSetup = readFileSync(
  resolve(process.cwd(), "tests/integration/setup/env.ts"),
  "utf8",
);

const enApiKeys = dictionaries.en.dash.apiKeys;
const enShell = dictionaries.en.dash.shell;

describe("SDK productization / connection UX", () => {
  it("exposes production ingest endpoint constant", () => {
    assert.match(constants, /ZYNTEKSIS_PRODUCTION_ENDPOINT/);
    assert.match(constants, /zynteksisv\.vercel\.app/);
  });

  it("API Keys page mounts connection guide", () => {
    assert.match(apiKeysPage, /ApiKeyConnectionGuide/);
  });

  it("connection guide covers install, browser, server, heartbeat, errors, dashboard", () => {
    assert.match(guide, /useDictionary|dict\.dash\.apiKeys/);
    assert.match(enApiKeys.connectionGuide.title, /Connect an external project/i);
    assert.match(enApiKeys.connectionGuide.tabBrowser, /Browser/i);
    assert.match(enApiKeys.connectionGuide.tabServer, /Server/i);
    assert.match(guide, /API_ROUTES\.sdkHeartbeat|\/api\/sdk\/heartbeat/);
    assert.match(guide, /API_ROUTES\.sdkError|\/api\/sdk\/error/);
    assert.match(enApiKeys.connectionGuide.warning, /service_role/);
    assert.equal(/service_role\s*[:=]\s*['"]/.test(guide), false);
  });

  it("landing install uses path-install, not fake public npm", () => {
    const landing = readFileSync(
      resolve(process.cwd(), "features/landing/data/content.ts"),
      "utf8",
    );
    assert.match(landing, /absolute\/path\/to\/zynteksis\/sdk/);
    assert.equal(
      /command:\s*"npm install @zynteksis\/sdk"/.test(landing),
      false,
    );
    assert.match(landing, /zynteksisv\.vercel\.app/);
  });

  it("installer uses path-install + production endpoint + secret warning", () => {
    assert.match(installer, /absolute\/path\/to\/zynteksis\/sdk/);
    assert.match(installer, /ZYNTEKSIS_PRODUCTION_ENDPOINT/);
    assert.match(enShell.sdkWarning, /service_role/);
    assert.match(installer, /shell\.sdkWarning|dict\.dash\.shell/);
  });

  it("reveal modal warns key is not service_role", () => {
    assert.match(reveal, /t\.revealWarning|apiKeys\.revealWarning/);
    assert.match(enApiKeys.revealWarning, /service_role/);
    assert.match(enApiKeys.revealWarning, /won't be able to view|won’t be able to view/i);
  });

  it("sdk README documents production endpoint and browser-only init", () => {
    assert.match(sdkReadme, /zynteksisv\.vercel\.app/);
    assert.match(sdkReadme, /X-Zynteksis-Key/);
    assert.match(sdkReadme, /browser-only/i);
    assert.match(sdkReadme, /service_role/);
  });

  it("integration harness keeps production mutation guards", () => {
    assert.match(guard, /assertNotProductionTarget/);
    assert.match(guard, /zynteksisv\.vercel\.app/);
    assert.match(envSetup, /INTEGRATION_TARGET/);
    assert.match(envSetup, /\.env\.local/);
  });
});
