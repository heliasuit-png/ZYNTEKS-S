# Services

The **application/business logic layer**. Services orchestrate domain use cases
and depend only on abstractions from `lib/`, the client factories in
`supabase/`, `ai/`, `emails/`, and the `sdk/`.

Guidelines:

- One service per bounded responsibility; keep them small and focused (SRP).
- Services receive their dependencies explicitly (dependency inversion) rather
  than reaching for global singletons where practical.
- Services are framework-agnostic: no `next/*` imports and no direct access to
  the request/response cycle. Route handlers and Server Actions call into
  services, not the other way around.
- All inputs are validated (Zod) at the boundary before reaching a service.
