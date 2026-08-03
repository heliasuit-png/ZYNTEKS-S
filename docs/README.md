# ZYNTEKSIS documentation

Maintainers: start with the [root README](../README.md), then dive into the
guides below. Target time-to-orientation for a new owner: **~30 minutes**.

## Core guides

| Document | Audience | Contents |
| -------- | -------- | -------- |
| [Architecture.md](./Architecture.md) | All engineers | Layers, dependency rules, request flows |
| [Backend.md](./Backend.md) | Server engineers | Services, API routes, auth, cron, email |
| [Frontend.md](./Frontend.md) | UI engineers | App Router, features, components, a11y |
| [Database.md](./Database.md) | Backend / DBA | Tables, enums, indexes, RLS, migrations |
| [API.md](./API.md) | Integrators | Every HTTP endpoint, auth, payloads, errors |
| [SDK.md](./SDK.md) | Client engineers | Local `@zynteksis/sdk` build/path-install, config, best practices |
| [AI.md](./AI.md) | Platform engineers | OpenAI assistant, streaming, usage limits |
| [Monitoring.md](./Monitoring.md) | SRE / backend | Ingest, heartbeats, incidents, status pages |
| [Workspace.md](./Workspace.md) | Product / backend | Multi-tenant RBAC, invites, audit |
| [Billing.md](./Billing.md) | Platform engineers | Plans, placeholder PaymentProvider |
| [Deployment.md](./Deployment.md) | DevOps | Supabase + Vercel production setup |

## Release (v1.0.0)

| Document | Contents |
| -------- | -------- |
| [../CHANGELOG.md](../CHANGELOG.md) | Version history |
| [../RELEASE_NOTES.md](../RELEASE_NOTES.md) | Buyer-facing release notes |
| [../VERSION.md](../VERSION.md) | Version / compatibility summary |
| [./FINAL_ENGINEERING_REPORT.md](./FINAL_ENGINEERING_REPORT.md) | Due-diligence engineering report |
| [./REMEDIATION_REPORT.md](./REMEDIATION_REPORT.md) | Post-audit High/Medium fixes |

## Operator / handover

| Document | Contents |
| -------- | -------- |
| [../BUYER_QUICK_START.md](../BUYER_QUICK_START.md) | ≈30-minute buyer deploy path |
| [../INSTALL.md](../INSTALL.md) | Full local install + first-success checklist |
| [../DEPLOYMENT.md](../DEPLOYMENT.md) | Production placeholders + short deploy steps |
| [../ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) | Full env var reference |
| [./DOCUMENTATION_VERIFICATION_REPORT.md](./DOCUMENTATION_VERIFICATION_REPORT.md) | Doc command verification results |
| [./COMMERCIAL_DELIVERY_REPORT.md](./COMMERCIAL_DELIVERY_REPORT.md) | Earlier packaging status |
| [./ENGINEERING_QUALITY_AUDIT.md](./ENGINEERING_QUALITY_AUDIT.md) | Quality audit |

## Screenshots

Place product screenshots in [`screenshots/`](./screenshots/) — see that folder’s README for naming conventions.
