import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const { data, error } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 10,
});
const users = (data?.users ?? [])
  .slice()
  .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  .slice(0, 10)
  .map((u) => ({
    email: u.email,
    created_at: u.created_at,
    email_confirmed_at: u.email_confirmed_at,
  }));

const { count: profiles } = await admin
  .from("profiles")
  .select("id", { count: "exact", head: true });
const { count: workspaces } = await admin
  .from("workspaces")
  .select("id", { count: "exact", head: true });
const { count: members } = await admin
  .from("workspace_members")
  .select("id", { count: "exact", head: true });

console.log(
  JSON.stringify(
    {
      listError: error?.message ?? null,
      recentUsers: users,
      counts: { profiles, workspaces, members },
    },
    null,
    2,
  ),
);
