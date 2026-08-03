# Scripts

Optional maintainer helpers. Prefer applying all SQL files in
`supabase/migrations/` through the Supabase SQL Editor or CLI
([docs/Database.md](../docs/Database.md)).

| Script | Purpose |
| ------ | ------- |
| `apply-workspace-migration.mjs` | Applies `0006_create_workspaces_enterprise.sql` via Postgres URI |
| `verify-workspace-migration.mjs` | Checks workspace-related tables/columns exist |
| `check-deps.mjs` | Scans source for unreferenced `package.json` dependencies |

## Database helpers

Require a Postgres connection string and the `pg` package:

```bash
npm install --no-save pg
```

Set one of: `DATABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_DATABASE_URL`, `POSTGRES_URL`.

```bash
# Windows (PowerShell)
$env:DATABASE_URL="postgresql://..."
node scripts/apply-workspace-migration.mjs
node scripts/verify-workspace-migration.mjs
```

```bash
# macOS / Linux
export DATABASE_URL="postgresql://..."
node scripts/apply-workspace-migration.mjs
node scripts/verify-workspace-migration.mjs
```

Never commit connection strings.

## Dependency check

```bash
node scripts/check-deps.mjs
```
