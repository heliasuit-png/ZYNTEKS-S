# Authentication v2

ZYNTEKSIS uses **Supabase Auth** as the single identity system. Email/password, magic links, password reset, email verification, and OAuth all share one `auth.users` record and linked **identities**. There is no separate account table for SSO users.

## Architecture

| Concern | Implementation |
| --- | --- |
| Identity store | Supabase Auth (`auth.users` + identities) |
| Session cookies | `@supabase/ssr` (HTTP-only, secure in production) |
| OAuth / email links | **PKCE** via `/auth/callback` |
| CSRF | Same-origin server actions + PKCE code verifier cookie |
| Session refresh | Next.js middleware (`middleware/index.ts`) |
| Rate limiting | `services/auth/rate-limit.ts` (per email/IP bucket) |
| Login history | `public.auth_login_events` |
| Last login | `profiles.last_login_at` |
| MFA / TOTP | Supabase Auth MFA factors + `profiles.mfa_enabled` cache |
| Passkeys | `public.webauthn_credentials` (schema ready; enrollment not exposed) |

Product profile rows are created by existing `handle_new_user` triggers. OAuth users receive the same profile path — **do not create duplicate user systems**.

## Environment

Copy from `.env.example` and set:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
```

These values **gate UI buttons** in the Next.js app (`lib/env.ts` → `getOAuthProviderConfigs()`). You must **also** paste the same Client ID/Secret into **Supabase Dashboard → Authentication → Providers**. Supabase Auth performs the OAuth handshake; the app starts PKCE with `signInWithOAuth`.

Common redirect URL (all providers):

```text
{NEXT_PUBLIC_APP_URL}/auth/callback
```

Add the same URL under **Authentication → URL Configuration → Redirect URLs**.

Local example: `http://localhost:3000/auth/callback`  
Production example: `https://your-domain.com/auth/callback`

Apply migration `supabase/migrations/0015_authentication_v2.sql` before relying on login history / last login columns.

---

## Google

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create **OAuth client ID** (Web application).
3. Authorized JavaScript origins: your app origin (e.g. `http://localhost:3000`).
4. Authorized redirect URIs — use the **Supabase callback**, not only the app callback:

```text
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

5. Copy Client ID and Client Secret into:
   - Supabase → Authentication → Providers → **Google** (enable)
   - `.env.local` → `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
6. Ensure app redirect URL `{APP_URL}/auth/callback` is listed in Supabase Redirect URLs.

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
6. Set `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in the app env.
7. Scopes used by the app: `read:user user:email`.

---

## Microsoft (Azure AD)

Supabase provider id is **`azure`** (UI label: Microsoft).

1. [Azure Portal](https://portal.azure.com/) → Microsoft Entra ID → App registrations → New registration.
2. Supported account types: choose per tenant policy (multi-tenant common for SaaS).
3. Redirect URI (Web):

```text
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

4. Certificates & secrets → New client secret.
5. Overview → Application (client) ID.
6. In Supabase → Providers → **Azure** (Microsoft):
   - Enable provider
   - Client ID / Secret
   - Optional: Azure Tenant URL (`https://login.microsoftonline.com/<tenant>` or `common`)
7. Set `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` in the app env.

---

## Apple

1. [Apple Developer](https://developer.apple.com/) → Certificates, Identifiers & Profiles.
2. Create an **App ID** with Sign In with Apple capability.
3. Create a **Services ID** (this is the OAuth Client ID).
4. Configure the Services ID:
   - Domains: your Supabase project host / app domain as required by Apple
   - Return URL:

```text
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

5. Create a Sign in with Apple **key**; download `.p8`.
6. In Supabase → Providers → **Apple**, follow the secret generation steps (Team ID, Key ID, `.p8` → JWT client secret).
7. Set `APPLE_CLIENT_ID` (Services ID) and `APPLE_CLIENT_SECRET` (generated JWT secret) in the app env.

Apple secrets expire; rotate the JWT client secret before expiry.

---

## Email methods (unchanged core)

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
