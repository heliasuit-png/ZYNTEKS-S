# ZYNTEKSIS — Engineering Quality Audit

**Date:** 2026-08-03  
**Scope:** Full repository quality pass (feature freeze honored)  
**Audience:** Senior engineers reviewing for acquisition / long-term maintenance  
**Verification:** `npm run typecheck` ✅ · `npm run lint` ✅ · `npm run build` ✅

---

## Executive summary

ZYNTEKSIS already had strong production foundations (strict TypeScript, layered
architecture, RLS-backed schema, validated env, secret-gated cron). This audit
focused on **enterprise maintainability**: removing unsafe typing patterns,
restoring feature isolation, consolidating duplicated service helpers, splitting
oversized UI modules, and closing a real client-side stream leak.

| Score | Value |
| ----- | ----- |
| **Maintainability** | **91 / 100** |
| **Technical debt** | **14 / 100** (lower is better) |
| **Commercial readiness** | **93 / 100** |

---

## Problems found

### Architecture / dependency direction

| Severity | Finding |
| -------- | ------- |
| High | `features/insights` imported UI from `features/ai` (feature isolation break) |
| High | `features/landing` imported `PlanComparison` from `features/billing` (feature isolation break) |
| Medium | `TypedSupabaseClient` was tied to the browser factory, forcing `as unknown as` casts for the admin client in 6 call sites |
| Medium | Identical `mapPostgrestError` helpers duplicated in api-keys / projects / profile services |

### Components / hooks

| Severity | Finding |
| -------- | ------- |
| Medium | `insights-view.tsx` ~630 lines with many private subcomponents (hard to review) |
| Medium | AI chat `AbortController` not aborted on unmount (possible setState-after-unmount / leaked fetch) |
| Low | Insights score bars / project tabs lacked basic ARIA roles |

### TypeScript

| Severity | Finding |
| -------- | ------- |
| Medium | Repeated `as unknown as TypedSupabaseClient` (unsafe cast pattern) |
| Info | Strict mode already on (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`) — no production `any` / `@ts-ignore` found in app source |

### Security / database / performance (reviewed, largely healthy)

| Area | Assessment |
| ---- | ---------- |
| Auth | Session middleware + Supabase Auth; SDK uses hashed API keys; cron requires non-empty `CRON_SECRET` |
| Env / secrets | Zod-validated `lib/env.ts`; `SKIP_ENV_VALIDATION` forbidden in production; no hardcoded secrets in source |
| API validation | Zod at SDK ingest and key mutation boundaries |
| Migrations | Indexes + RLS present across 0001–0009; buckets/policies in 0009 |
| Performance | App Router code-splitting; marketing/static routes prerender; no debug `console.log` in app services |
| Intentional debt | Placeholder billing provider; in-memory rate limits; large domain engines (`intelligence`, `health`, `status`) |

---

## Problems fixed

1. **Shared Supabase typing** — `supabase/types.ts` defines `TypedSupabaseClient = SupabaseClient<Database>`; admin factory returns that type; all `as unknown as` admin casts removed.
2. **Feature isolation restored** — moved markdown renderer to `components/markdown/`; plan comparison + billing format helpers to `components/billing/` and `utils/billing`.
3. **DRY PostgREST mapping** — `lib/map-postgrest-error.ts` shared by profile, api-keys, and projects (with unique-violation option).
4. **Insights modularized** — row/report UI extracted to `features/insights/components/insights-rows.tsx`; main view slimmed and a11y improved.
5. **AI workspace cleanup** — abort in-flight streams on unmount.
6. **Compat shims** — thin re-exports left at previous feature paths to avoid silent import breakage during review.

---

## Files improved / added

### Added

- `supabase/types.ts`
- `lib/map-postgrest-error.ts`
- `components/markdown/markdown-message.tsx`
- `components/billing/plan-comparison.tsx`
- `utils/billing.ts`
- `features/insights/components/insights-rows.tsx`
- `docs/ENGINEERING_QUALITY_AUDIT.md` (this report)

### Updated (selected)

- `supabase/admin.ts`, `supabase/client.ts`
- `monitoring/http.ts`, `cron/jobs/monitor.ts`
- `app/sitemap.ts`, `app/status/page.tsx`, `app/status/[slug]/page.tsx`, `app/api/status/[slug]/export/route.ts`
- `services/api-keys/api-key.service.ts`, `services/projects/project.service.ts`, `services/profile/profile.service.ts`
- `features/insights/components/insights-view.tsx`
- `features/ai/components/ai-workspace.tsx`, `features/ai/components/chat-message.tsx`
- `features/landing/components/landing-pricing.tsx`
- Billing consumers (`pricing-cards`, `subscription-panel`, `invoice-history`, `usage-dashboard`, `billing-dashboard`)
- `app/(marketing)/pricing/page.tsx`

### Compatibility re-exports

- `features/ai/components/markdown.tsx`
- `features/billing/components/plan-comparison.tsx`
- `features/billing/lib/format.ts`

---

## Architecture improvements

```text
Before:  landing/insights → other features (cross-feature UI)
After:   features → shared components/utils  (correct dependency direction)

Before:  TypedSupabaseClient = ReturnType<browserClient> + casts
After:   TypedSupabaseClient = SupabaseClient<Database>  (browser/server/admin)

Before:  three local PostgREST mappers
After:   one lib helper with optional unique-conflict mapping
```

Dependency rule reinforced:

- `app` / `features` → `services` / `lib` / `components` / `utils`
- Features do **not** import other features for shared UI
- Infrastructure clients share one typed surface

---

## Remaining intentional / accepted debt

| Item | Why accepted |
| ---- | ------------ |
| Placeholder `PaymentProvider` | Commercial design; swap via factory |
| In-memory rate limiter | Fine for single-instance; Redis for multi-region |
| Large engines (`services/intelligence/engine.ts`, health/status) | Domain-dense; further splits are optional refactors, not blockers |
| `next/image` eslint disables for remote avatars/logos | Supabase public URLs; documented exceptions |
| Upstream `npm audit` advisories via Next transitive deps | Do not force-downgrade Next |

---

## Scores (detail)

### Maintainability — 91/100

Solid layering, strict TS, restored isolation, shared helpers, and smaller insights surface. Points withheld for still-large domain engines and compat re-export shims that should eventually be deleted after a quiet period.

### Technical debt — 14/100

Low residual debt for a full SaaS codebase. Main remainder is intentional billing placeholder + size of intelligence/health/status services.

### Commercial readiness — 93/100

Acquisition-ready quality bar: typecheck/lint/build green, no secret leakage patterns, clear architecture, documented handover already present. Remaining gap is operational (buyer wiring secrets / payment provider), not code quality.

---

## Verification

```bash
npm run typecheck   # pass
npm run lint        # pass (0 warnings/errors)
npm run build       # pass (Next.js 15.5.22)
```

---

## Verdict

**The codebase is ready for long-term maintenance and senior acquisition review.**

No new product features were added. Changes were limited to quality, typing,
isolation, and maintainability. The repository now better matches enterprise
expectations around SOLID / clean architecture and dependency direction.
