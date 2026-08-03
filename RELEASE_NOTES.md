# ZYNTEKSIS v1.0.0 — Release Notes

**Release date:** 2026-08-03  
**Package type:** Commercial SaaS source-code  
**Status:** Production-ready for buyer deployment

---

## Highlights

ZYNTEKSIS 1.0.0 is a complete, self-hostable observability and operations
platform. Buyers receive the full Next.js application, Supabase migrations,
browser SDK, documentation, and deployment guidance required to go live
without additional product engineering.

### What you can do on day one

1. Clone and `npm install`
2. Configure `.env.local` from `.env.example`
3. Apply migrations `0001`–`0009`
4. Deploy to Vercel + Supabase
5. Log in → create project → generate API key
6. Install `@zynteksis/sdk` → receive heartbeats → monitor errors

---

## Included modules

| Module | Status |
| ------ | ------ |
| Authentication | Complete |
| Workspaces / RBAC | Complete |
| Projects & API keys | Complete |
| SDK ingest | Complete |
| Errors / Health / Incidents | Complete |
| Insights | Complete |
| Notifications | Complete |
| Status pages | Complete |
| AI assistant | Complete |
| Settings | Complete |
| Billing (provider placeholder) | Complete architecture |
| Marketing landing | Complete |
| Documentation | Complete |

---

## Requirements

| Requirement | Version / note |
| ----------- | -------------- |
| Node.js | ≥ 20 |
| npm | Bundled with Node |
| Supabase | Project with Auth + Postgres + Storage |
| Vercel (recommended) | Hosting + Cron |
| OpenAI | Production AI features |
| Resend | Production email |

---

## Upgrade / install notes

This is the initial commercial baseline (`1.0.0`). There is no prior public
semver line to upgrade from inside this package.

After deploy, set production env vars identically to `.env.example` (real
values), configure Auth redirect URLs, and confirm cron + Storage buckets.

---

## Breaking / intentional gaps

- **Payments:** checkout returns `not_configured` until you implement
  `PaymentProvider` in `services/billing/factory.ts`.
- **Multi-instance rate limits:** in-memory; replace for horizontal scale.
- **License:** governed by your commercial purchase agreement (not open-source
  by default unless separately licensed).

---

## Verification performed for this release

```text
npm run typecheck   ✅
npm run lint        ✅
npm run build       ✅
```

---

## Support materials

| Doc | Path |
| --- | ---- |
| README | `README.md` |
| Install | `INSTALL.md` |
| Changelog | `CHANGELOG.md` |
| Version summary | `VERSION.md` |
| Final engineering report | `docs/FINAL_ENGINEERING_REPORT.md` |
| Docs index | `docs/README.md` |

Thank you for choosing ZYNTEKSIS.
