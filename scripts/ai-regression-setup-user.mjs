/**
 * Create a confirmed throwaway user for local AI Assistant UI regression.
 * Prints JSON: { ok, email, password, userId }
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
const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const email = `ai.reg.${Date.now()}@zynteksis.test`;
const password = "AiRegTest1a";

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: "AI Regression" },
});

if (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }));
  process.exit(1);
}

console.log(
  JSON.stringify({ ok: true, email, password, userId: data.user.id }),
);
