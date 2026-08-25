# Backup & recovery runbook

Operational guide for ZYNTEKSIS on **Supabase (Postgres / Auth / Storage)** +
**Vercel (Next.js)**. This repository does **not** embed automated database
backup jobs; recovery depends on your Supabase project plan and Vercel
deployment history.

Do not treat this document as a guarantee that Point-in-Time Recovery (PITR) or
daily backups are enabled on your project — verify in the Supabase Dashboard.

---

## Concepts

### Supabase backups / PITR

Supabase manages Postgres for your project. Depending on **plan and project
settings** (confirm in Dashboard → Database / Settings):

- **Daily backups** — scheduled snapshots on many paid plans  
- **Point-in-Time Recovery (PITR)** — restore to a timestamp within a retention
  window when the feature is enabled for the project  

Auth users and Storage objects are part of the Supabase project; treat restore
as a **project-level** operation unless Supabase documents a narrower scope for
your plan.

This repo’s migrations under `supabase/migrations/` recreate **schema**, not
customer data. Restoring from backup is how you recover rows.

### Application rollback (Vercel)

Vercel keeps prior deployments. Promoting / redeploying a previous successful
build rolls back **application code and serverless config** (including
`vercel.json` cron definitions in that commit). It does **not** undo Postgres
writes.

### RPO / RTO (targets to set for your org)

| Metric | Meaning | How to set for ZYNTEKSIS |
| ------ | ------- | ------------------------ |
| **RPO** (Recovery Point Objective) | Maximum acceptable data loss | Bound by Supabase backup/PITR retention you actually have enabled (e.g. “last daily backup” vs “PITR to minute X”). Measure from Dashboard, not from this repo. |
| **RTO** (Recovery Time Objective) | Maximum acceptable downtime | Sum of: detect → decide restore vs app rollback → execute → verify. Practice on **staging** first. |

Suggested starting targets (adjust to your SLA): RPO ≤ 24h without PITR; RPO
minutes-level only if PITR is confirmed enabled; RTO ≤ 2h for app-only
incidents, longer when a DB restore is required.

---

## When to app-rollback vs database-restore

| Situation | Prefer |
| --------- | ------ |
| Bad UI / API bug, no bad schema or data | **Vercel app rollback** |
| Bad feature flag / env misconfig | Fix env or rollback app |
| Cron storm / bad job logic | Rollback app; optionally disable crons by redeploying a build with empty/safer schedules |
| Destructive or incorrect migration already applied | **Forward-fix migration** if possible; otherwise **DB restore** to pre-migration point |
| Mass accidental deletes / corrupted rows | **DB restore** (PITR or backup) |
| Compromised secrets | Rotate secrets (below); app rollback alone is insufficient |

---

## Restore — pre-checklist

- [ ] Confirm environment (**staging** vs **production**); never restore production while intending staging  
- [ ] Incident severity + chosen RPO timestamp / backup id recorded  
- [ ] Current `NEXT_PUBLIC_SUPABASE_URL` project ref noted  
- [ ] Announce maintenance if user-facing  
- [ ] Pause writers if possible (maintenance mode / freeze deploys)  
- [ ] Export any forensic evidence needed (logs, sample rows) **before** overwrite  
- [ ] Verify operator identity; no secrets pasted into tickets/chat  

---

## Staging restore drill (recommended)

1. Use the **staging** Supabase project only (`docs/STAGING_SUPABASE.md`).  
2. Confirm backup/PITR availability in that project’s Dashboard.  
3. Create disposable rows (or use a known fixture).  
4. Restore staging to a known point (Dashboard-guided).  
5. Re-apply any migrations that must exist **after** that point (see
   [Database.md](./Database.md) order: non-payment path through `0017`,
   `0019`, `0020`, `0021` as required; skip `0018` unless payment is in scope).  
6. Point local staging app (`scripts/dev-staging.mjs`) at staging; run
   `GET /api/health`, login smoke, one SDK heartbeat.  
7. Record actual RTO for the drill.  
8. **Restore verification:** confirm expected fixture rows (or their absence
   after PITR), auth login, and that RLS negatives still reject cross-tenant
   access before declaring the drill successful.  

**This Phase B task does not execute a production restore.**

---

## Production restore procedure (high level)

1. Complete the pre-checklist.  
2. In Supabase Dashboard, initiate restore/PITR for the **production** project
   only with explicit approval.  
3. Wait until the project is healthy (Dashboard status).  
4. Ensure schema matches the app you will run:
   - If restore is **before** `0017` / `0019` / `0020` / `0021`, either redeploy
     an older app compatible with that schema **or** re-apply forward
     non-payment migrations in order before shipping current `main`
     (`0018` remains payment-only).  
5. Confirm Vercel env still points at the same project URL/keys (or updated
   keys if Supabase rotated them during restore).  
6. Deploy or promote the matching app build.  
7. Run the post-restore checklist (restore verification).  

Exact Dashboard clicks vary by Supabase UI version — follow current Supabase
docs for your plan.

---

## Restore — post-checklist

- [ ] `GET /api/health` ok; `supabaseHost` matches expected project  
- [ ] Auth: login works; logout invalidates protected access (needs **0017** + app)  
- [ ] RLS smoke: cannot self-join workspace / foreign API key insert (needs **0019**)  
- [ ] Create project + API key; SDK heartbeat accepted  
- [ ] Cron: unauthorized → 401; authorized health/monitor → ok (`CRON_SECRET`)  
- [ ] Storage uploads (avatars / logos)  
- [ ] Admin / billing surfaces behave as expected for your payment mode  
- [ ] Monitor for error spikes for 30–60 minutes  

---

## Secret rotation during incidents

Rotate if leakage or compromise is suspected. Prefer Dashboard / host UI; never
commit secrets.

| Secret | Where | Notes |
| ------ | ----- | ----- |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + local staging env | Highest privilege; rotate in Supabase, update host env, redeploy |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Usually stable; rotate if project keys regenerated |
| `CRON_SECRET` | Vercel (server only) | Update env; Vercel Cron uses Bearer token; redeploy if needed |
| `OPENAI_API_KEY` / `RESEND_API_KEY` | Vercel | Rotate at provider; update env |
| Lemon Squeezy keys | Vercel | Only if payment enabled; see [LEMON_SQUEEZY.md](./LEMON_SQUEEZY.md) |
| User JWT / sessions | App | Force logout / suspend stamps `sessions_invalidated_at` (**0017**) |

After rotation: redeploy or restart so runtime picks up env; smoke `/api/health`
and one authenticated request.

---

## Verification checklist (summary)

- [ ] Backups/PITR status confirmed in Supabase Dashboard (do not assume)  
- [ ] RPO/RTO written for the org  
- [ ] Staging restore drill completed at least once  
- [ ] App rollback path known (Vercel deployments)  
- [ ] Migration order known ([Database.md](./Database.md))  
- [ ] Secret owners / rotation owners named  

---

## Related

[Deployment.md](./Deployment.md) · [Database.md](./Database.md) ·
[../ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) ·
[STAGING_SUPABASE.md](./STAGING_SUPABASE.md)
