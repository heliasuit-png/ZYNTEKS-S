/**
 * Reproduce product signup against the live Supabase project and inspect side effects.
 * Prints Auth response + whether auth.users / profiles / workspaces / members exist.
 *
 *   node scripts/diagnose-signup.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const env = {};
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = env.NEXT_PUBLIC_APP_URL;

if (!url || !anon || !service) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const stamp = Date.now();
const email =
  process.env.DIAG_SIGNUP_EMAIL?.trim() ||
  `signup.diag.${stamp}@zynteksis.test`;
const password = "DiagTest1a";
const fullName = "Diag User";
const emailRedirectTo = `${appUrl}/auth/callback?next=/dashboard`;

const anonClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(
  JSON.stringify(
    {
      step: "config",
      appUrl,
      emailRedirectTo,
      email,
    },
    null,
    2,
  ),
);

const { data, error } = await anonClient.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo,
    data: { full_name: fullName },
  },
});

const authResult = {
  step: "signUp",
  called: true,
  error: error
    ? {
        message: error.message,
        status: error.status,
        code: error.code ?? null,
        name: error.name,
      }
    : null,
  userId: data.user?.id ?? null,
  userEmail: data.user?.email ?? null,
  emailConfirmedAt: data.user?.email_confirmed_at ?? null,
  identitiesCount: data.user?.identities?.length ?? null,
  sessionPresent: Boolean(data.session),
  // Supabase returns user with empty identities when signup is "fake" (duplicate / confirm disabled quirks)
  identities: (data.user?.identities ?? []).map((i) => ({
    provider: i.provider,
    identity_id: i.identity_id,
  })),
};

console.log(JSON.stringify(authResult, null, 2));

const userId = data.user?.id;
if (!userId) {
  console.log(JSON.stringify({ step: "db", skipped: "no user id returned" }, null, 2));
  process.exit(error ? 2 : 0);
}

// Admin Auth API: confirm user exists in auth.users
const { data: listed, error: listError } = await admin.auth.admin.getUserById(userId);

const { data: profile, error: profileError } = await admin
  .from("profiles")
  .select("id,email,full_name")
  .eq("id", userId)
  .maybeSingle();

const { data: workspaces, error: wsError } = await admin
  .from("workspaces")
  .select("id,name,slug,owner_id")
  .eq("owner_id", userId);

const workspaceIds = (workspaces ?? []).map((w) => w.id);
const { data: members, error: memberError } = workspaceIds.length
  ? await admin
      .from("workspace_members")
      .select("workspace_id,user_id,role,status")
      .eq("user_id", userId)
      .in("workspace_id", workspaceIds)
  : { data: [], error: null };

console.log(
  JSON.stringify(
    {
      step: "db",
      authUsers: {
        found: Boolean(listed?.user),
        error: listError
          ? { message: listError.message, status: listError.status }
          : null,
        email: listed?.user?.email ?? null,
        emailConfirmedAt: listed?.user?.email_confirmed_at ?? null,
        bannedUntil: listed?.user?.banned_until ?? null,
      },
      profiles: {
        found: Boolean(profile),
        error: profileError?.message ?? null,
        row: profile,
      },
      workspaces: {
        count: workspaces?.length ?? 0,
        error: wsError?.message ?? null,
        rows: workspaces,
      },
      workspace_members: {
        count: members?.length ?? 0,
        error: memberError?.message ?? null,
        rows: members,
      },
      inference: {
        signUpReturnedError: Boolean(error),
        authUserPersisted: Boolean(listed?.user),
        profilePersisted: Boolean(profile),
        workspacePersisted: (workspaces?.length ?? 0) > 0,
        memberPersisted: (members?.length ?? 0) > 0,
        likelyTriggerRollback:
          Boolean(error?.message?.toLowerCase().includes("database")) ||
          (Boolean(error) && !listed?.user),
        likelyEmailConfirmationRequired:
          !error && Boolean(data.user) && !data.session,
        likelyDuplicateOrDisabledSignup:
          !error &&
          Boolean(data.user) &&
          (data.user.identities?.length ?? 0) === 0,
      },
    },
    null,
    2,
  ),
);

// Cleanup diagnostic user if created
if (listed?.user) {
  const { error: delError } = await admin.auth.admin.deleteUser(userId);
  console.log(
    JSON.stringify(
      {
        step: "cleanup",
        deleted: !delError,
        error: delError?.message ?? null,
      },
      null,
      2,
    ),
  );
}
