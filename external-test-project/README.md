# Disposable external consumer (staging only)

Path-installs `@zynteksis/sdk` from `../sdk` and posts heartbeat / error /
performance / events to a **staging** ZYNTEKSIS base URL.

Never point this at `https://zynteksisv.vercel.app`.

```bash
cd sdk && npm install && npm run build
cd ../external-test-project && npm install

# Staging only:
$env:STAGING_BASE_URL="https://your-staging-app.example"
$env:INTEGRATION_API_KEY="ZYN-KEY-..."   # disposable staging key — never commit
npm run ingest
```

Aliases: `INTEGRATION_BASE_URL` is accepted only when it is not production.
Missing env → BLOCKED (exit 0). Production host → refused (exit 2).
