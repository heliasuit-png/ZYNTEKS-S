# Frontend

UI architecture for ZYNTEKSIS: Next.js App Router, feature modules, and shared
components.

## App Router layout

| Segment | Role |
| ------- | ---- |
| `app/(marketing)/` | Landing, pricing, docs, legal, contact |
| `app/(auth)/` | Login, register, forgot/reset password |
| `app/(dashboard)/` | Authenticated product UI |
| `app/status/` | Public status directory + `/status/[slug]` |
| `app/auth/` | OAuth/PKCE + OTP confirm route handlers |
| `app/api/` | HTTP API (see [API.md](./API.md)) |

Layouts compose chrome (marketing shell vs dashboard shell). Middleware in
`middleware.ts` gates authenticated routes.

## Feature modules

Each domain under `features/<name>/` is self-contained:

```text
features/<name>/
├── components/     # Feature UI
├── hooks/          # Feature hooks (optional)
├── server/         # Data loaders (optional)
├── actions.ts      # Server actions
├── schemas.ts      # Zod
├── types.ts
└── index.ts        # Public exports
```

**Isolation:** do not import from another feature. Promote shared UI to
`components/` or helpers to `utils/` / `lib/`.

Current modules: `ai`, `api-keys`, `auth`, `billing`, `dashboard`, `errors`,
`health`, `incidents`, `insights`, `landing`, `notifications`, `projects`,
`settings`, `status`, `workspace`.

## Shared UI

| Path | Role |
| ---- | ---- |
| `components/ui/` | Low-level primitives |
| `components/dashboard/` | Shell, panels, badges, motion, command palette |
| `components/brand/` | Brand marks |
| `components/markdown/` | Shared markdown renderer (AI + insights) |
| `components/billing/` | Plan comparison table |

Styling: Tailwind CSS v4 + design tokens (`zt-*` CSS variables in `styles/`).

## State & data

- Server Components fetch via services where possible
- Client interactivity: `"use client"` components + server actions
- Auth on client: `features/auth/hooks/use-auth.ts` (session subscription + cleanup)
- Dashboard context: `features/dashboard/context/`

## Accessibility conventions

- Prefer native `<button type="button">` / proper labels
- Use `aria-hidden` on decorative icons
- Status/public tables include captions / `sr-only` text where needed
- Avoid relying on color alone for severity (badges + icons)

## Performance notes

- Route-level code splitting via App Router
- Marketing pages largely static
- Heavy client views (AI chat, explorers) are client components by necessity
- Prefer dynamic import only when adding large optional widgets (do not redesign)

## Related docs

[Architecture.md](./Architecture.md) · [SDK.md](./SDK.md) · [AI.md](./AI.md)
