# Staging Supabase setup (hosted — no Docker)

This project keeps **production** and **staging** completely separate.

| | Production | Staging |
|---|---|---|
| Supabase | Existing production project | Separate hosted project |
| Env | `.env.local` / Vercel production | `.env.staging` (`STAGING_*`) |
| Integration mutations | **Forbidden** | Disposable fixtures only |

Docker / local Supabase are **not** used by the integration harness.

## 1. Create a separate Supabase project (manual)

In the [Supabase dashboard](https://supabase.com/dashboard), create a **new**
project dedicated to Zynteksis staging.

Do **not** reuse the production project ref / URL / keys.

Record (locally, never commit):

- Project URL → `STAGING_SUPABASE_URL`
- `anon` `public` key → `STAGING_SUPABASE_ANON_KEY`
- `service_role` key → `STAGING_SUPABASE_SERVICE_ROLE_KEY`

## 2. Apply Zynteksis migrations to staging only

Preferred (CLI — staging project only):

```bash
npx supabase link --project-ref <STAGING_PROJECT_REF>
npx supabase db push
```

Or with database password in `.env.staging` (never commit):

```bash
# Required for first-time schema apply when tables are not yet exposed:
# STAGING_DB_PASSWORD=<Supabase Dashboard → Project Settings → Database password>
npm install postgres   # one-time, if not already present
node scripts/apply-staging-migrations.mjs
node scripts/probe-staging-schema.mjs   # must print SCHEMA_READY: YES
```

> Note: a `head: true` REST probe can false-positive when tables are missing.
> Always use `scripts/probe-staging-schema.mjs` (limit select) before mutation E2E.

**Never** run `db push` / migration apply against the production project as part
of integration setup.

## 3. Point a non-production app at staging

HTTP ingest / AI tests need an app whose `NEXT_PUBLIC_SUPABASE_*` and
`SUPABASE_SERVICE_ROLE_KEY` are the **staging** values (not `.env.local`
production).

Options:

1. Temporary local `npm run dev` with staging vars in the process environment
   (do not overwrite committed production `.env.local`), or
2. A separate staging deploy whose env is staging-only

Set:

```bash
INTEGRATION_TARGET=staging
STAGING_BASE_URL=<that non-production app origin>
```

`STAGING_BASE_URL` must **not** be `https://zynteksisv.vercel.app`.

## 4. Fill `.env.staging`

```bash
cp .env.staging.example .env.staging
# edit .env.staging with staging values only
```

## 5. Run integration

```bash
npm run test:integration
```

If `INTEGRATION_TARGET` or any required `STAGING_*` value is missing, the
harness returns **BLOCKED** / `STAGING SUPABASE REQUIRED` and performs **no**
mutations.
