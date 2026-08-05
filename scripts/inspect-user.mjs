import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/inspect-user.mjs <email>");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  let value = line.slice(i + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  env[line.slice(0, i).trim()] = value;
}

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: listed, error } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
const user = (listed?.users ?? []).find(
  (u) => u.email?.toLowerCase() === email.toLowerCase(),
);
if (!user) {
  console.log(JSON.stringify({ found: false, listError: error?.message }, null, 2));
  process.exit(0);
}

const { data: profile } = await admin
  .from("profiles")
  .select("id,email,full_name")
  .eq("id", user.id)
  .maybeSingle();
const { data: workspaces } = await admin
  .from("workspaces")
  .select("id,slug,name")
  .eq("owner_id", user.id);
const { data: members } = await admin
  .from("workspace_members")
  .select("workspace_id,role,status")
  .eq("user_id", user.id);

console.log(
  JSON.stringify(
    {
      auth: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        identities: (user.identities ?? []).map((i) => i.provider),
      },
      profile,
      workspaces,
      members,
    },
    null,
    2,
  ),
);
