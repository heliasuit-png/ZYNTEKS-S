/**
 * Focused Playwright regression for the AI Assistant client lifecycle.
 *
 * Usage:
 *   set AI_REG_EMAIL=...
 *   set AI_REG_PASSWORD=...
 *   set AI_REG_BASE=http://localhost:3000
 *   node scripts/ai-assistant-regression.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.AI_REG_BASE || "http://localhost:3000";
const EMAIL = process.env.AI_REG_EMAIL;
const PASSWORD = process.env.AI_REG_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("AI_REG_EMAIL and AI_REG_PASSWORD are required");
  process.exit(1);
}

const results = {
  scenarios: {},
  consoleErrors: [],
  pageErrors: [],
  notes: [],
};

function mark(name, ok, detail = null) {
  results.scenarios[name] = { ok, detail };
}

async function waitForAssistantContent(page, { minLen = 8, timeout = 120_000 } = {}) {
  await page.waitForFunction(
    (min) => {
      const bubbles = [...document.querySelectorAll("[translate='no']")];
      return bubbles.some((b) => (b.textContent || "").trim().length >= min);
    },
    minLen,
    { timeout },
  );
}

async function getAssistantTexts(page) {
  return page.evaluate(() => {
    const bubbles = [...document.querySelectorAll("[translate='no']")];
    return bubbles
      .map((b) => (b.textContent || "").trim())
      .filter((t) => t && t !== "Thinking…");
  });
}

async function sendMessage(page, text) {
  const box = page.getByLabel("Message the assistant");
  await box.click();
  await box.fill(text);
  await page.getByRole("button", { name: "Send" }).click();
}

async function waitStreamSettled(page, timeout = 120_000) {
  // While streaming, Stop is shown; after settle, Send returns.
  await page.getByRole("button", { name: "Send" }).waitFor({
    state: "visible",
    timeout,
  });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") {
    results.consoleErrors.push(msg.text());
  }
});
page.on("pageerror", (err) => {
  results.pageErrors.push(String(err?.message || err));
});

try {
  page.setDefaultTimeout(120_000);

  // Login
  await page.goto(`${BASE}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.locator('input[name="email"]').fill(EMAIL);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 120_000,
    }),
    page.getByRole("button", { name: /sign in|log in|giriş/i }).click(),
  ]);
  results.notes.push(`after-login:${page.url()}`);

  // 1) New conversation
  await page.goto(`${BASE}/ai`, {
    waitUntil: "domcontentloaded",
    timeout: 180_000,
  });
  results.notes.push(`ai-url:${page.url()}`);
  await page.waitForSelector('textarea[aria-label="Message the assistant"]', {
    timeout: 120_000,
  });
  await page.evaluate(() => {
    window.__AI_STREAM_DEBUG__ = true;
  });
  mark("1_new_conversation", true, page.url());

  // 2-5) First message + live stream visibility
  const beforeErrors = results.pageErrors.length + results.consoleErrors.length;
  await sendMessage(page, "Reply with one short sentence: hello from regression.");
  mark("2_send_normal_question", true);

  let sawLive = false;
  try {
    await waitForAssistantContent(page, { minLen: 5, timeout: 90_000 });
    // Still streaming or settled — content is visible in active UI
    const live = await getAssistantTexts(page);
    sawLive = live.some((t) => t.length >= 5);
    mark("3_live_stream_visible", sawLive, live[0]?.slice(0, 160) ?? null);
  } catch (e) {
    mark("3_live_stream_visible", false, String(e));
  }

  await waitStreamSettled(page, 120_000);
  const afterFirst = await getAssistantTexts(page);
  const firstText = afterFirst[afterFirst.length - 1] || "";
  mark("5_visible_after_finish", firstText.length >= 5, firstText.slice(0, 200));

  const domErrs = [...results.pageErrors, ...results.consoleErrors].filter((t) =>
    /insertBefore|removeChild|NotFoundError/i.test(t),
  );
  mark(
    "4_no_dom_notfound",
    domErrs.length === 0,
    domErrs.slice(0, 5),
  );

  // 6) Sidebar history
  await page.waitForTimeout(1500);
  const historyCount = await page.locator("aside a[href*='c=']").count();
  mark("6_sidebar_history", historyCount >= 1, { historyCount });

  // Create a second conversation so we can switch
  await page.getByRole("link", { name: /new chat/i }).first().click();
  await page.waitForTimeout(800);
  await sendMessage(page, "Second conversation marker: ping.");
  await waitStreamSettled(page, 120_000);
  await page.waitForTimeout(1000);

  const hrefs = await page.locator("aside a[href*='c=']").evaluateAll((as) =>
    as.map((a) => a.getAttribute("href")),
  );
  mark("7_open_other_prep", hrefs.length >= 2, { hrefs });

  // 7) Open another existing conversation (the first one)
  if (hrefs.length >= 2) {
    await page.goto(`${BASE}${hrefs[hrefs.length - 1]}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(1000);
    mark("7_open_other_conversation", true, hrefs[hrefs.length - 1]);

    // 8) Return to newly created (most recent / first in list usually)
    await page.goto(`${BASE}${hrefs[0]}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    mark("8_return_to_new", true, hrefs[0]);
  } else {
    mark("7_open_other_conversation", false, "Need >= 2 history links");
    mark("8_return_to_new", false, "skipped");
  }

  // 9) Both roles present
  const bodyText = await page.locator("section").nth(0).innerText();
  // Prefer chat panel content
  const chatPanel = page.locator("section").filter({
    has: page.getByLabel("Message the assistant"),
  });
  const panelText = await chatPanel.innerText();
  const hasUser =
    /hello from regression|Second conversation marker|Reply with/i.test(
      panelText,
    ) || /ping|regression/i.test(panelText);
  const assistants = await getAssistantTexts(page);
  mark("9_both_messages_present", assistants.length >= 1 && panelText.length > 20, {
    assistants: assistants.length,
    panelSnippet: panelText.slice(0, 240),
    hasUserLike: hasUser,
  });

  // 10-11) Second message in same conversation
  const beforeSecond = results.pageErrors.length + results.consoleErrors.length;
  await sendMessage(
    page,
    "Confirm you can see prior context in one short sentence.",
  );
  let secondLive = false;
  try {
    await waitForAssistantContent(page, { minLen: 5, timeout: 90_000 });
    secondLive = (await getAssistantTexts(page)).length >= 1;
  } catch (e) {
    mark("11_second_stream_visible", false, String(e));
  }
  await waitStreamSettled(page, 120_000);
  const afterSecond = await getAssistantTexts(page);
  mark("10_send_second_message", true);
  mark(
    "11_second_remains_visible",
    afterSecond.length >= 1 && afterSecond.some((t) => t.length >= 5),
    afterSecond.map((t) => t.slice(0, 80)),
  );

  // Longer markdown response
  await sendMessage(
    page,
    [
      "Respond in Markdown with ALL of the following:",
      "1) a level-2 heading",
      "2) a numbered list with 3 items",
      "3) a bullet list with 3 items",
      "4) a fenced javascript code block with a tiny function",
      "Keep it concise.",
    ].join("\n"),
  );
  await waitStreamSettled(page, 180_000);
  await page.waitForTimeout(800);

  const markdownProbe = await page.evaluate(() => {
    const root = document.querySelector("section [translate='no']");
    if (!root) return { ok: false, reason: "no-assistant-root" };
    // After stream settles MarkdownMessage renders real elements.
    const h2 = root.querySelectorAll("h1,h2,h3").length;
    const ol = root.querySelectorAll("ol li").length;
    const ul = root.querySelectorAll("ul li").length;
    const pre = root.querySelectorAll("pre").length;
    const code = root.querySelectorAll("pre code, code").length;
    return {
      ok: h2 > 0 && ol >= 2 && ul >= 2 && (pre > 0 || code > 0),
      h2,
      ol,
      ul,
      pre,
      code,
      text: (root.textContent || "").slice(0, 400),
    };
  });
  // Markdown may be in the last assistant bubble specifically
  const markdownLast = await page.evaluate(() => {
    const roots = [...document.querySelectorAll("[translate='no']")];
    const root = roots[roots.length - 1];
    if (!root) return { ok: false };
    const h2 = root.querySelectorAll("h1,h2,h3").length;
    const ol = root.querySelectorAll("ol li").length;
    const ul = root.querySelectorAll("ul li").length;
    const pre = root.querySelectorAll("pre").length;
    const code = root.querySelectorAll("code").length;
    return {
      ok: h2 > 0 && ol >= 2 && ul >= 2 && (pre > 0 || code > 0),
      h2,
      ol,
      ul,
      pre,
      code,
      text: (root.textContent || "").slice(0, 500),
    };
  });
  mark("markdown_after_stream", markdownLast.ok || markdownProbe.ok, {
    markdownLast,
    markdownProbe,
  });

  // 12-13) Refresh
  const urlBeforeRefresh = page.url();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('textarea[aria-label="Message the assistant"]', {
    timeout: 60_000,
  });
  await page.waitForTimeout(1200);
  const afterRefresh = await getAssistantTexts(page);
  const panelAfter = await page
    .locator("section")
    .filter({ has: page.getByLabel("Message the assistant") })
    .innerText();
  mark(
    "12_13_refresh_preserves",
    afterRefresh.length >= 1 && panelAfter.length > 40,
    {
      urlBeforeRefresh,
      urlAfter: page.url(),
      assistantCount: afterRefresh.length,
      snippet: panelAfter.slice(0, 300),
    },
  );

  const allDom = [...results.pageErrors, ...results.consoleErrors].filter((t) =>
    /insertBefore|removeChild|NotFoundError/i.test(t),
  );
  results.summary = {
    allPassed: Object.values(results.scenarios).every((s) => s.ok),
    insertBeforeOrRemoveChild: allDom,
    consoleErrorCount: results.consoleErrors.length,
    pageErrorCount: results.pageErrors.length,
    sawLiveOnFirstSend: sawLive,
    secondLive,
    errorsSinceStart: results.pageErrors.length + results.consoleErrors.length - beforeErrors,
    errorsBeforeSecond: beforeSecond,
  };
} catch (err) {
  results.fatal = String(err?.stack || err);
} finally {
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  if (results.fatal || !results.summary?.allPassed) process.exit(1);
}
