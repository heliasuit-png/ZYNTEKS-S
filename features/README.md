# Features

Each subdirectory is a **self-contained feature module** that owns a single
business domain end-to-end. Features are isolated: they never import from each
other directly. Shared behavior belongs in `lib/`, `services/`, `components/`
or `utils/`.

Recommended layout for a feature (`features/<feature-name>/`):

```text
<feature-name>/
├── components/   # UI specific to this feature
├── hooks/        # React hooks specific to this feature
├── server/       # Server actions / data-access for this feature
├── schemas.ts    # Zod schemas and validation
├── types.ts      # Feature-local types
└── index.ts      # Public surface of the feature
```

Only expose what other layers need through the feature's `index.ts`.
