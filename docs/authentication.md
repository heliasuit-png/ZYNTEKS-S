# Authentication v2

ZYNTEKSIS uses **Supabase Auth** as the single identity system. Email/password, magic links, password reset, email verification, and OAuth (Google, GitHub) all share one `auth.users` record and linked **identities**. There is no separate account table for SSO users.

## Supported methods

- Google OAuth
- GitHub OAuth
- Email / password
- Magic link
- Password reset
- Email verification

## Architecture

| Concern | Implementation |
| --- | --- |
| Identity store | Supabase Auth (`auth.users` + identities) |
| Session cookies | `@supabase/ssr` (HTTP-only, secure in production) |
| OAuth / email links | **PKCE** via `/auth/callback` |
| Provider enablement | Supabase Auth public settings (`/auth/v1/settings`) |
| OAuth start | `supabase.auth.signInWithOAuth()` |
| CSRF | Same-origin server actions + PKCE code verifier cookie |
| Session refresh | Next.js middleware (`middleware/index.ts`) |
| Rate limiting | `services/auth/rate-limit.ts` (per email/IP bucket) |
| Login history | `public.auth_login_events` |
| Last login | `profiles.last_login_at` |
| MFA / TOTP | Supabase Auth MFA factors + `profiles.mfa_enabled` cache |
| Passkeys | `public.webauthn_credentials` (schema ready; enrollment not exposed) |

Product profile rows are created by existing `handle_new_user` triggers. OAuth users receive the same profile path — **do not create duplicate user systems**.

Login buttons are **not** gated by Next.js env vars. The app reads which providers are enabled from Supabase Auth settings. Failures surface the real Supabase Auth error message.

## Environment

Optional local references (do **not** control button visibility):

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

**Required setup:** enable each provider and paste Client ID/Secret in **Supabase Dashboard → Authentication → Providers**. Supabase Auth performs the OAuth handshake; the app calls `signInWithOAuth`.

App redirect URL (Supabase Redirect URLs + OAuth `redirectTo`):

```text
https://zynteksisv.vercel.app/auth/callback
```

Supabase Auth provider callback (Google/GitHub console — do not change):

```text
https://xwxfjzyfrcaxdwvkdedq.supabase.co/auth/v1/callback
```

Also set Supabase **Site URL** to `https://zynteksisv.vercel.app`.

Apply migration `supabase/migrations/0015_authentication_v2.sql` before relying on login history / last login columns.

---

## Google

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create **OAuth client ID** (Web application).
3. Authorized JavaScript origins: `https://zynteksisv.vercel.app`.
4. Authorized redirect URIs — use the **Supabase callback**, not only the app callback:

```text
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

5. Copy Client ID and Client Secret into **Supabase → Authentication → Providers → Google** and **enable** the provider.
6. Optionally mirror values in `.env.local` as documentation only.
7. Ensure app redirect URL `{APP_URL}/auth/callback` is listed in Supabase Redirect URLs.

---

## GitHub

1. GitHub → Settings → Developer settings → [OAuth Apps](https://github.com/settings/developers) → New OAuth App.
2. Homepage URL: `{NEXT_PUBLIC_APP_URL}`
3. Authorization callback URL:

```text
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

4. Generate a client secret.
5. Enable **GitHub** in Supabase Auth Providers with Client ID/Secret.
6. Optionally mirror values in `.env.local` as documentation only.
7. Scopes used by the app: `read:user user:email`.

---

## Email methods

| Method | How |
| --- | --- |
| Email / password | Existing `signInWithPassword` / `signUpWithPassword` |
| Magic link | `signInWithOtp` → email → `/auth/callback` (PKCE) |
| Password reset | `resetPasswordForEmail` → callback → `/reset-password` |
| Email verification | Supabase confirm email → callback |

SMTP: configure a custom SMTP provider in Supabase (or Resend) to avoid Auth email rate limits on the built-in quota.

---

## Admin integration

- **`/admin/users`** — Auth providers from Supabase identities, MFA flag, last login, login history drawer.
- **`/admin/security`** — `auth_login_events` for recent/suspicious logins; alerts for suspicious events.
- **`/admin/audit`** — actions `auth_login_suspicious`, `auth_oauth_linked`.

---

## Security notes

- Never commit real OAuth secrets.
- Prefer production HTTPS so cookies are `Secure`.
- Suspicious login detection compares IP / country / browser against prior successful events and writes `admin_audit_logs` when flagged.
- MFA enrollment UI can call Supabase Auth MFA APIs; passkeys should persist to `webauthn_credentials` when implemented.
