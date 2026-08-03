# Monitoring

Observability stack: SDK ingest, health, errors, incidents, notifications, and
public status pages.

## Pipeline

```text
@zynteksis/sdk
      │  API key
      ▼
/api/sdk/{heartbeat,error,events,performance}
      │
      ▼
authenticate → rate limit → Zod → ingest.service → Postgres
      │
      ├── Dashboard (Errors / Health / Incidents / Insights)
      ├── Cron monitor (outages, auto-resolve, notify)
      └── Public status (/status/[slug])
```

## Code map

| Concern | Location |
| ------- | -------- |
| HTTP + CORS + auth | `monitoring/http.ts` |
| Schemas | `monitoring/schemas.ts` |
| Persist / dedupe | `monitoring/ingest.service.ts`, `fingerprint.ts` |
| Engine | `services/monitoring/` |
| Health UI/services | `features/health`, `services/health` |
| Errors | `features/errors`, `services/dashboard/errors.service.ts` |
| Incidents | `features/incidents`, `services/incidents` |
| Status | `features/status`, `services/status` |
| Cron | `cron/jobs/monitor.ts`, `cron/jobs/health.ts` |

## Heartbeats

SDK posts on an interval (default 60s). Absence of heartbeats for more than
**20 minutes** (`MONITORING.heartbeatTimeoutMs`) feeds outage detection in the
monitor cron job (`GET /api/cron/monitor` with `Authorization: Bearer <CRON_SECRET>`).

## Errors & performance

- Errors are fingerprinted for dedupe  
- Levels use `event_level`: `debug`, `info`, `warning`, `error`, `fatal`  
- Performance logs store Web Vitals-style metrics  
- Exports: `/api/errors/export`, `/api/health-monitor/export`  

## Incidents & notifications

- **Opened by the monitor cron** when a project stops heartbeating (source
  `monitor`, initial status `investigating`). There is no dashboard “create
  incident” form in v1.0.0.
- Operators **update / resolve** incidents in `/incidents` (valid statuses:
  `investigating` → `identified` → `monitoring` → `resolved`).
- Severities: `low`, `medium`, `high`, `critical`.
- Notification types: `incident_created`, `incident_resolved`,
  `critical_error`, `api_key_revoked`, `project_created`.
- Dashboard feed: `/notifications` (backed by `notification_logs` + queue).
- Email delivery via Resend when `RESEND_API_KEY` / `EMAIL_FROM` are configured.
- Preferences + queue + logs (migrations 0004 / 0007).

## Status pages

- Admin: `/status-pages`  
- Public: `/status/[slug]`  
- Export: `/api/status/[slug]/export`  
- Maintenance windows: migration `0008` (`scheduled`, `in_progress`,
  `completed`, `cancelled`)  

## Operational checklist

- [ ] Migrations through `0009`  
- [ ] `CRON_SECRET` set; monitor cron running  
- [ ] Project API key active  
- [ ] Heartbeats arriving  
- [ ] Status slug resolves when `is_public`  
- [ ] Notifications appear after monitor cron (e.g. `project_created`)  

## Related

[API.md](./API.md) · [SDK.md](./SDK.md) · [Database.md](./Database.md) · [Deployment.md](./Deployment.md)
