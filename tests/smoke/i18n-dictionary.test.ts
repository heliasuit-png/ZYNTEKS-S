import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { dictionaries } from "@/lib/i18n/dictionaries";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALES,
  isLocale,
  resolveLocale,
} from "@/lib/i18n/config";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") {
    return [prefix];
  }
  const out: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${key}` : key;
    out.push(...leafPaths(child, next));
  }
  return out;
}

describe("i18n dictionaries and locale cookie", () => {
  it("exposes en and tr locales with cookie name", () => {
    assert.deepEqual([...LOCALES], ["en", "tr"]);
    assert.equal(DEFAULT_LOCALE, "en");
    assert.equal(LOCALE_COOKIE, "zynteksis_locale");
    assert.equal(isLocale("tr"), true);
    assert.equal(isLocale("de"), false);
    assert.equal(resolveLocale("tr"), "tr");
    assert.equal(resolveLocale("nope"), "en");
  });

  it("keeps en/tr dictionary key parity", () => {
    const enKeys = leafPaths(dictionaries.en).sort();
    const trKeys = leafPaths(dictionaries.tr).sort();
    assert.deepEqual(trKeys, enKeys);
  });

  it("keeps non-empty string leaves in both locales", () => {
    for (const locale of LOCALES) {
      const keys = leafPaths(dictionaries[locale]);
      for (const key of keys) {
        const parts = key.split(".");
        let cur: unknown = dictionaries[locale];
        for (const part of parts) {
          cur = (cur as Record<string, unknown>)[part];
        }
        assert.equal(typeof cur, "string", `${locale}.${key}`);
        assert.ok(String(cur).length > 0, `${locale}.${key} empty`);
      }
    }
  });
});
