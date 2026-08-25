# Database

Supabase PostgreSQL schema for ZYNTEKSIS. Source of truth:
`supabase/migrations/` — apply files in numeric order from the repository
(do not invent numbers).

Typed client: `types/database.ts` + `TypedSupabaseClient` (`supabase/types.ts`).

---

## Migration order (non-payment)

Apply these in order for a normal product install:

| # | File | Summary |
| - | ---- | ------- |
| 1 | `0001_create_profiles.sql` | Profiles, plan/role/status enums, signup trigger |
| 2 | `0002_create_projects_and_api_keys.sql` | Projects, API keys, key logs |
| 3 | `0003_create_error_collection.sql` | Errors, events, heartbeats, performance |
| 4 | `0004_create_incidents_notifications_status.sql` | Incidents, notifications, status pages |
| 5 | `0005_create_ai_assistant.sql` | AI conversations, messages, feedback, usage |
| 6 | `0006_create_workspaces_enterprise.sql` | Workspaces, members, invites, audit, sessions |
| 7 | `0007_notification_center_preferences.sql` | Notification center preference tweaks |
| 8 | `0008_status_pages_complete.sql` | Maintenance windows, status completeness |
| 9 | `0009_settings_profile_preferences.sql` | Profile prefs JSON + Storage buckets/policies |
| 10 | `0010_create_admin_users.sql` | Platform admin_users |
| 11 | `0011_create_admin_audit_logs.sql` | Admin audit log |
| 12 | `0012_workspace_admin_command_center.sql` | Workspace admin surfaces |
| 13 | `0013_platform_settings_feature_flags.sql` | Platform settings + feature flags |
| 14 | `0014_align_platform_settings_columns.sql` | Settings column alignment |
| 15 | `0015_authentication_v2.sql` | Auth login events / session-related columns |
| 16 | `0016_admin_users_lock_privileged_columns.sql` | Lock privileged admin_users columns |
| 17 | `0017_sessions_invalidated_at.sql` | `profiles.sessions_invalidated_at` for logout/suspend JWT rejection |
| 19 | `0019_security_hardening.sql` | Member/API-key/profile RLS hardening + invite accept RPC |
| 20 | `0020_workspace_telemetry_isolation.sql` | Workspace-aware SELECT for telemetry / keys / incidents |
| 21 | `0021_owner_guard_ai_quota.sql` | Workspace owner_id transfer guard + atomic AI usage RPC |

### When to apply 0017 and 0019

| Migration | Apply when |
| --------- | ---------- |
| **0017** | Before relying on server-side session invalidation after logout, force-logout, or suspend. Application code compares JWT `iat` to `sessions_invalidated_at`. |
| **0019** | Before exposing production to untrusted clients that can call PostgREST/Supabase with a user JWT. Closes workspace self-join, API key foreign-project insert, and privileged profile column updates. Prefer **staging first**, then production DB, then deploy app builds that call `accept_workspace_invitation`. |
| **0020** | Before expecting workspace members to see shared project telemetry (errors, heartbeats, performance, incidents, API key metadata). Apply after **0019**. |

**Production order of operations (DB vs app):** apply required SQL migrations to the target database **before** (or atomically ahead of) shipping application code that depends on new columns/RPCs/policies. See [Deployment.md](./Deployment.md).

### Payment migration — only when Lemon Squeezy is intentionally enabled

| # | File | Summary |
| - | ---- | ------- |
| 18 | `0018_billing_lemon_squeezy.sql` | Billing customers / subscriptions / webhook idempotency |

Do **not** apply `0018` as part of a default non-payment deploy. Keep
`LEMON_SQUEEZY_MODE=off` until credentials and an explicit enablement decision
exist. Details: [LEMON_SQUEEZY.md](./LEMON_SQUEEZY.md).

**How to run:** Supabase SQL Editor (paste each file) or a controlled apply
script against the **intended** project only (see `scripts/apply-staging-migrations.mjs`
for staging). Never apply staging scripts to production by accident.

**Rollback:** forward-only. On a fresh project, recreate DB and re-apply. In
production, ship a new numbered corrective migration. See also root
[DATABASE.md](../DATABASE.md).

---

## Enums

Exact production values from `supabase/migrations/` (also mirrored in
`types/database.ts` and `lib/constants.ts`). There is **no** `open` value on
`incident_status` — new monitor incidents start as `investigating`.

| Enum | Values |
| ---- | ------ |
| `user_role` | `user`, `admin` |
| `user_status` | `active`, `inactive`, `banned` |
| `subscription_plan` | `free`, `pro`, `enterprise` |
| `project_framework` | `nextjs`, `react`, `vue`, `angular`, `nuxt`, `express`, `nodejs`, `laravel`, `django`, `aspnet`, `flutter_web`, `other` |
| `project_status` | `active`, `paused`, `archived` |
| `api_key_environment` | `production`, `staging`, `development` |
| `api_key_status` | `active`, `revoked` |
| `api_key_log_event` | `created`, `used`, `revoked`, `regenerated`, `auth_success`, `auth_failed` |
| `event_level` | `debug`, `info`, `warning`, `error`, `fatal` |
| `incident_status` | `investigating`, `identified`, `monitoring`, `resolved` |
| `incident_severity` | `low`, `medium`, `high`, `critical` |
| `incident_source` | `monitor`, `manual` |
| `notification_type` | `incident_created`, `incident_resolved`, `critical_error`, `api_key_revoked`, `project_created` |
| `notification_channel` | `email`, `dashboard`, `slack`, `discord` |
| `notification_delivery_status` | `pending`, `processing`, `sent`, `failed`, `skipped` |
| `notification_level` | `info`, `success`, `warning`, `error` |
| `ai_message_role` | `user`, `assistant`, `system` |
| `ai_feedback_rating` | `up`, `down` |
| `workspace_role` | `owner`, `administrator`, `developer`, `viewer`, `billing_manager` |
| `workspace_member_status` | `active`, `suspended` |
| `workspace_invitation_status` | `pending`, `accepted`, `declined`, `cancelled`, `expired` |
| `status_maintenance_status` | `scheduled`, `in_progress`, `completed`, `cancelled` |
| `audit_action` | `login`, `logout`, `project_created`, `project_updated`, `project_deleted`, `api_key_generated`, `api_key_revoked`, `incident_closed`, `ai_analysis`, `billing_changed`, `invitation_sent`, `invitation_accepted`, `invitation_declined`, `invitation_cancelled`, `member_removed`, `member_suspended`, `member_restored`, `role_changed`, `ownership_transferred`, `workspace_updated`, `session_revoked`, `password_changed`, `security_updated` |

---

## Tables & relations

### Identity & billing plan

| Table | Relations | Notes |
| ----- | --------- | ----- |
| `profiles` | `id` → `auth.users(id)` | Plan, role, status, avatar, preferences JSON (0009); `sessions_invalidated_at` (0017) |

### Projects & keys

| Table | Relations | Notes |
| ----- | --------- | ----- |
| `projects` | `user_id` → profiles; `workspace_id` → workspaces (0006) | Slug unique per owner/workspace |
| `api_keys` | `project_id`, `user_id` | Stores **hash** only; INSERT bound to manageable project (0019) |
| `api_key_logs` | `api_key_id`, `project_id`, `user_id` | Audit trail |

### Telemetry

| Table | Relations | Notes |
| ----- | --------- | ----- |
| `errors` | `project_id` | Fingerprinted groups; RLS owner-scoped (`user_id`) |
| `error_events` | → errors / project | Occurrences; RLS owner-scoped |
| `heartbeats` | `project_id` | SDK liveness; RLS owner-scoped |
| `performance_logs` | `project_id` | Web vitals; RLS owner-scoped |

> **v1.0.0 note:** Telemetry SELECT policies use `auth.uid() = user_id`, not
> workspace membership. See [Workspace.md](./Workspace.md) § Telemetry visibility.

### Incidents & notifications

| Table | Relations | Notes |
| ----- | --------- | ----- |
| `incidents` | `project_id`, owner user | Lifecycle; INSERT project binding (0019) |
| `incident_updates` | `incident_id` | Timeline |
| `notification_preferences` | per user | Channel/type prefs |
| `notification_queue` | user / payload | Outbox |
| `notification_logs` | delivery history | Dedupe index |

### Status pages

| Table | Relations | Notes |
| ----- | --------- | ----- |
| `status_pages` | owner user | Public slug |
| `status_page_components` | → status_pages | Component status |
| `status_page_maintenance` | → status_pages | Windows (0008) |

### AI

| Table | Relations | Notes |
| ----- | --------- | ----- |
| `ai_conversations` | user, optional project | Pins, counters |
| `ai_messages` | → conversations | Trigger syncs counters |
| `ai_feedback` | → messages / user | up/down |
| `ai_usage` | user | Metering |

### Workspaces (enterprise)

| Table | Relations | Notes |
| ----- | --------- | ----- |
| `workspaces` | `owner_id` | Org |
| `workspace_members` | workspace + user + role | No self-join INSERT; invite accept via RPC (0019) |
| `workspace_invitations` | workspace + email + role | Pending invites |
| `audit_logs` | workspace + actor | Security/compliance |
| `user_sessions` | user | Session inventory |

### Storage (0009)

| Bucket | Purpose |
| ------ | ------- |
| `avatars` | User avatars (`{user_id}/…`) |
| `workspace-logos` | Workspace branding |

---

## Indexes (selected)

Critical lookup indexes include:

- `profiles_email_key` (unique lower email)
- `profiles_sessions_invalidated_at_idx` (0017)
- `projects_user_id_idx`, `projects_workspace_id_idx`, `projects_created_at_idx`
- `api_keys_key_hash_idx`, `api_keys_project_id_idx`
- `errors_project_fingerprint_idx`, `errors_project_last_seen_idx`
- `heartbeats_project_created_idx`, `performance_logs_project_created_idx`
- `incidents_project_status_idx`, notification queue status/scheduled
- Workspace member/invite/audit indexes (0006)
- Status component key + maintenance indexes (0008)

Full list: search `create index` in `supabase/migrations/`.

---

## Triggers & functions

| Object | Role |
| ------ | ---- |
| `handle_updated_at()` | Generic `updated_at` bump |
| `*_set_updated_at` triggers | profiles, projects, incidents, AI, workspaces, … |
| `handle_new_user()` | On `auth.users` insert → profile (+ workspace bootstrap in 0006) |
| `handle_ai_message_change()` | Keeps conversation message counters in sync |
| `is_workspace_member(uuid)` | RLS helper |
| `workspace_member_role(uuid)` | RLS helper |
| `user_can_manage_project(uuid)` | RLS helper (0019) |
| `accept_workspace_invitation(text)` | SECURITY DEFINER invite accept (0019) |
| `workspace_members_guard_privileged_update` | Blocks member self role/status escalation (0019) |

---

## RLS policy model

RLS is enabled on application tables. Patterns:

| Pattern | Tables |
| ------- | ------ |
| Owner-scoped (`auth.uid() = user_id`) | Early projects/keys/telemetry/AI/incidents |
| Workspace membership helpers | Projects/members after 0006 |
| Invitee-or-admin | `workspace_invitations` |
| Project-manage check | `api_keys` / `incidents` INSERT (0019) |
| Column grants (privileged locked) | `profiles.role` / `subscription_plan` / `status` (0019) |
| Public read | Selected status page / maintenance policies |
| Storage path checks | avatars & workspace-logos (0009) |

**Service role** (admin client) bypasses RLS for SDK ingest, cron, and public
status reads that intentionally use privileged access with app-level filters.

Never disable RLS in production without a reviewed replacement.

---

## ER sketch (simplified)

```text
auth.users ──1:1── profiles
                │
                ├──< projects >── api_keys
                │       │
                │       ├── errors / error_events / heartbeats / performance_logs
                │       ├── incidents >── incident_updates
                │       └── ai_conversations >── ai_messages
                │
workspaces ──< workspace_members >── profiles
     │
     ├── workspace_invitations
     ├── audit_logs
     └── projects.workspace_id
```

---

## Verification

After migrate: register a user → profile row exists → create project → create
API key → SDK heartbeat inserts into `heartbeats`.

Optional helper scripts: [`scripts/README.md`](../scripts/README.md).
