# Integration test harness (hosted staging only)

## Safety

- Mutation suites require `INTEGRATION_TARGET=staging` plus
  `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_ANON_KEY`,
  `STAGING_SUPABASE_SERVICE_ROLE_KEY`, and `STAGING_BASE_URL`.
- Production app host (`zynteksisv.vercel.app`) and production Supabase host
  are always rejected.
- The harness **never** auto-loads `.env.local`.
- Docker / local Supabase are **not** required and not used.
- Snapsell is out of scope.

See [docs/STAGING_SUPABASE.md](../../docs/STAGING_SUPABASE.md) for how to create
the separate staging project and apply migrations.

## Commands

```bash
npm run test:integration
```

Without staging credentials the gate still PASSes production-safety + rate-limit
unit checks; mutation / AI / external SDK suites stay **BLOCKED**.

## Layout

```
tests/integration/
  setup/           # staging env gate, production guard, disposables
  safety/          # always-on production / staging guard unit tests
  fixtures/
  integration-e2e.test.ts
external-test-project/   # disposable @zynteksis/sdk consumer (staging only)
```
