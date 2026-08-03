# AI assistant

Workspace AI chat powered by OpenAI, grounded in project telemetry context.

## Surfaces

| Surface | Path |
| ------- | ---- |
| Chat UI | `/ai` → `features/ai` |
| Settings | `/settings/ai` |
| HTTP stream | `POST /api/ai/chat` |
| Services | `services/ai/*` |
| Client | `ai/client.ts`, `ai/config.ts` |
| Schema | migration `0005_create_ai_assistant.sql` |

## Configuration

| Env var | Role |
| ------- | ---- |
| `OPENAI_API_KEY` | Required in production |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |

See [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md).

## Request flow

1. Authenticated session required (not API keys)  
2. Zod validate body (`conversationId?`, `projectId?`, `message`, `regenerate`)  
3. Plan usage limits checked in services  
4. Context builder assembles telemetry-aware prompt (`services/ai/context.builder.ts`)  
5. Stream NDJSON events to the client (`meta` / `delta` / `done` / `error`)  
6. Persist messages + usage rows  

## Data model

- `ai_conversations` — ownership, optional project link, pins, counters  
- `ai_messages` — roles `user` \| `assistant` \| `system`  
- `ai_feedback` — up/down ratings  
- `ai_usage` — metering for plan limits  

Trigger `handle_ai_message_change` keeps conversation counters in sync.

## Security notes

- OpenAI key is **server-only**  
- Prompts treat user/project content as untrusted data (see prompt builder rules)  
- Do not log secrets from customer telemetry in production  

## Extending (post-takeover)

- Change model via `OPENAI_MODEL`  
- Prompt / tool changes: `services/ai/prompt.builder.ts`, `context.builder.ts`  
- Do not redesign the chat UI under feature freeze  

## Related

[API.md](./API.md) · [Backend.md](./Backend.md) · [Monitoring.md](./Monitoring.md)
