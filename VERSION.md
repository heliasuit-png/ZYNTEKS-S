# Version Summary — ZYNTEKSIS 1.0.0

| Field | Value |
| ----- | ----- |
| **Product** | ZYNTEKSIS |
| **Version** | `1.0.0` |
| **Release date** | 2026-08-03 |
| **Package** | Commercial SaaS source-code |
| **App `package.json`** | `1.0.0` |
| **SDK `@zynteksis/sdk`** | `1.0.0` |
| **Node engine** | `>=20.0.0` |
| **Framework** | Next.js 15 · React 19 · TypeScript 5 (strict) |
| **Database** | Supabase PostgreSQL migrations `0001`–`0009` |

## Release artifacts

| Artifact | Path |
| -------- | ---- |
| Changelog | [`CHANGELOG.md`](./CHANGELOG.md) |
| Release notes | [`RELEASE_NOTES.md`](./RELEASE_NOTES.md) |
| Final engineering report | [`docs/FINAL_ENGINEERING_REPORT.md`](./docs/FINAL_ENGINEERING_REPORT.md) |
| Env template | [`.env.example`](./.env.example) |

## Compatibility matrix

| Component | Version / pin |
| --------- | ------------- |
| next | `^15.1.0` (verified build on 15.5.x) |
| react / react-dom | `^19.0.0` |
| @supabase/supabase-js | `^2.45.4` |
| @supabase/ssr | `^0.12.4` |
| zod | `^3.23.8` |
| openai | `^7.3.0` |
| resend | `^4.0.1` |
| tailwindcss | `^4.0.0` |

## Semver policy (for buyers)

After takeover, treat this package as the `1.0.0` baseline:

- **MAJOR** — breaking API / schema / auth changes  
- **MINOR** — backward-compatible features  
- **PATCH** — fixes and docs  

Schema changes should add new numbered migrations (`0010_…`) rather than
editing shipped `0001`–`0009` on live databases.
