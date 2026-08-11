/**
 * Production AI Assistant smoke test (no app code changes).
 *
 *   AI_REG_EMAIL=... AI_REG_PASSWORD=... node scripts/ai-prod-smoke.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.AI_REG_BASE || "https://zynteksisv.vercel.app";
const EMAIL = process.env.AI_REG_EMAIL;
const PASSWORD = process.env.AI_REG_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("AI_REG_EMAIL and AI_REG_PASSWORD required");
  process.exit(1);
}

const out = {
  consoleErrors: [],
  pageErrors: [],
  checks: {},
};

function check(name, ok, detail = null) {
  out.checks[name] = { ok, detail };
}

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext()).newPage();
page.setDefaultTimeout(120_000);
page.on("console", (m) => {
  if (m.type() === "error") out.consoleErrors.push(m.text());
});
page.on("pageerror", (e) => out.pageErrors.push(String(e?.message || e)));

try {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(EMAIL);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 120_000 }),
    page.getByRole("button", { name: /sign in|log in|giriş/i }).click(),
  ]);

  await page.goto(`${BASE}/ai`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForSelector('textarea[aria-label="Message the assistant"]');
  check("ai_loads", page.url().includes("/ai"), page.url());

  await page.getByLabel("Message the assistant").fill(
    "Reply with one short sentence: production smoke ok.",
  );
  await page.getByRole("button", { name: "Send" }).click();

  await page.waitForFunction(() => {
    const bubbles = [...document.querySelectorAll("[translate='no']")];
    return bubbles.some((b) => {
      const t = (b.textContent || "").trim();
      return t.length >= 5 && t !== "Thinking…";
    });
  }, null, { timeout: 120_000 });
  check("streaming_visible", true);

  await page.getByRole("button", { name: "Send" }).waitFor({ state: "visible" });
  const texts = await page.evaluate(() =>
    [...document.querySelectorAll("[translate='no']")]
      .map((b) => (b.textContent || "").trim())
      .filter((t) => t && t !== "Thinking…"),
  );
  check("remains_after_complete", texts.some((t) => /smoke|ok|production/i.test(t) || t.length >= 8), texts.map((t) => t.slice(0, 120)));

  const domErrs = [...out.pageErrors, ...out.consoleErrors].filter((t) =>
    /insertBefore|removeChild|NotFoundError/i.test(t),
  );
  check("no_dom_notfound", domErrs.length === 0, domErrs);

  await page.waitForTimeout(1200);
  const hrefs = await page.locator("aside a[href*='c=']").evaluateAll((as) =>
    as.map((a) => a.getAttribute("href")),
  );
  check("history_has_conversation", hrefs.length >= 1, hrefs.slice(0, 3));

  if (hrefs.length >= 1) {
    const current = hrefs[0];
    await page.getByRole("link", { name: /new chat/i }).first().click();
    await page.waitForTimeout(800);
    await page.goto(`${BASE}${current}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('textarea[aria-label="Message the assistant"]');
    await page.waitForTimeout(1000);
    const afterReturn = await page.evaluate(() =>
      [...document.querySelectorAll("[translate='no']")]
        .map((b) => (b.textContent || "").trim())
        .filter(Boolean),
    );
    const panel = await page
      .locator("section")
      .filter({ has: page.getByLabel("Message the assistant") })
      .innerText();
    check(
      "return_keeps_conversation",
      afterReturn.length >= 1 && /smoke|production|ok|reply/i.test(panel),
      { afterReturn: afterReturn.map((t) => t.slice(0, 100)), panel: panel.slice(0, 240) },
    );
  } else {
    check("return_keeps_conversation", false, "no history href");
  }

  out.summary = {
    allPassed: Object.values(out.checks).every((c) => c.ok),
    domErrors: domErrs,
  };
} catch (e) {
  out.fatal = String(e?.stack || e);
} finally {
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
  if (out.fatal || !out.summary?.allPassed) process.exit(1);
}
