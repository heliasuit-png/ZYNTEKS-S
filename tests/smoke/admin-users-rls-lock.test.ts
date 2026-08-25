/**
 * Structural regression for P1 admin_users privilege escalation fix.
 * Asserts migration 0016 locks privileged columns for authenticated clients.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/0016_admin_users_lock_privileged_columns.sql",
);
const baselinePath = resolve(
  process.cwd(),
  "supabase/migrations/0010_create_admin_users.sql",
);

const migration = readFileSync(migrationPath, "utf8");
const baseline = readFileSync(baselinePath, "utf8");

describe("admin_users privileged column lock (0016)", () => {
  it("revokes UPDATE from anon and authenticated", () => {
    assert.match(
      migration,
      /revoke\s+update\s+on\s+table\s+public\.admin_users\s+from\s+anon\s*,\s*authenticated/i,
    );
  });

  it("grants UPDATE (last_login) only to authenticated", () => {
    assert.match(
      migration,
      /grant\s+update\s*\(\s*last_login\s*\)\s+on\s+table\s+public\.admin_users\s+to\s+authenticated/i,
    );
  });

  it("re-asserts service_role DML for promote/demote paths", () => {
    assert.match(
      migration,
      /grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+table\s+public\.admin_users\s+to\s+service_role/i,
    );
  });

  it("does not drop the own-row SELECT policy from baseline", () => {
    assert.match(baseline, /Admin users can select own row/);
    assert.equal(
      /drop\s+policy\s+"Admin users can select own row"/i.test(migration),
      false,
    );
  });

  it("does not drop the own-row UPDATE RLS policy (row filter for last_login)", () => {
    assert.match(baseline, /Admin users can update own row/);
    assert.equal(
      /drop\s+policy\s+"Admin users can update own row"/i.test(migration),
      false,
    );
  });

  it("does not alter schema or role enum", () => {
    assert.equal(/alter\s+table\s+public\.admin_users\s+add/i.test(migration), false);
    assert.equal(/drop\s+type\s+public\.admin_platform_role/i.test(migration), false);
    assert.equal(/create\s+type\s+public\.admin_platform_role/i.test(migration), false);
  });
});
