# Workspace

Multi-tenant organization model: members, roles, invitations, audit, and
active-workspace selection.

## Concepts

| Concept | Description |
| ------- | ----------- |
| Workspace | Tenant boundary for projects and members |
| Member | User + role inside a workspace |
| Invitation | Pending email invite with assignable role |
| Audit log | Security-relevant actions |
| Active workspace | Cookie-selected current org for the session |

## Telemetry visibility (workspace-aware)

Projects are listed and managed through **workspace membership** (migration
`0006`). After migration **`0020_workspace_telemetry_isolation.sql`**, SELECT
policies on telemetry (`errors`, `error_events`, `heartbeats`,
`performance_logs`), API key metadata, and incidents use
`user_can_view_project` so workspace members can see shared project data —
while writes remain constrained (ingest via API key / privileged paths;
management via `user_can_manage_project` from **0019**).

**Do not** rewrite shipped baseline migrations on live databases; add new
numbered files instead. Apply `0020` in order after `0019`.

Schema: migration `0006_create_workspaces_enterprise.sql` + `0020`.  
Services: `services/workspace/*`, `services/projects/access.ts`.  
UI: `features/workspace`, dashboard routes (`/organization`, `/members`,
`/invitations`, `/audit`, `/security`).

## Roles

| Role | Summary |
| ---- | ------- |
| `owner` | Full control including delete/transfer |
| `administrator` | Broad admin; cannot delete/transfer workspace |
| `developer` | Project + API key write; AI; read audit/security |
| `viewer` | Read-only across most surfaces |
| `billing_manager` | Billing manage + limited reads |

Assignable via invite (not `owner`): administrator, developer, viewer,
billing_manager.

## Permissions

Central map: `services/workspace/permissions.ts`.

Examples:

- `workspace:read|update|delete|transfer`
- `members:read|invite|remove|suspend|change_role`
- `projects:read|create|update|delete`
- `api_keys:read|manage`
- `billing:read|manage`
- `ai:use`
- `notifications:read|manage`
- `audit:read`
- `security:read|manage`
- `settings:manage`

Helpers: `permissionsForRole`, `hasPermission`, `assertPermission`.

## Invitations

1. Admin/owner invites email + role  
2. Optional Resend email (`emails/templates/invite`)  
3. Invitee accepts → membership row  
4. RLS allows invitee or admin to see pending invites  

## Active workspace

Resolved via cookie helpers (`WORKSPACE_COOKIE`,
`resolveActiveWorkspace`, `setActiveWorkspaceCookie`). Dashboard shell
workspace switcher updates the cookie.

## Search

`GET /api/workspace/search?q=&workspaceId=` — membership-gated command-palette
style hits.

## Security sessions

`user_sessions` + security UI under `/security` for session inventory /
revocation flows backed by workspace services.

## Related

[Database.md](./Database.md) · [Backend.md](./Backend.md) · [API.md](./API.md)
