import { z } from "zod";

/**
 * Environment variable validation.
 *
 * Validation is performed lazily (on first access) so that build tooling and
 * client bundles never crash at import time. Access the validated environment
 * through the `env` proxy, which throws a descriptive error the first time an
 * invalid or missing variable is read.
 */

// Production requires every secret to be present. In development (and test)
// these integration secrets are optional so the app can boot without them;
// missing values fall back to an empty string. Security in production is never
// reduced — the requirement is only relaxed for local development.
const isProductionEnv = process.env.NODE_ENV === "production";

/**
 * A secret that is required in production but optional (defaulting to an empty
 * string) during development. The output type is always `string`, so callers
 * never have to handle `undefined`.
 */
function productionRequiredSecret(): z.ZodType<
  string,
  z.ZodTypeDef,
  string | undefined
> {
  return isProductionEnv ? z.string().min(1) : z.string().default("");
}

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: productionRequiredSecret(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  RESEND_API_KEY: productionRequiredSecret(),
  EMAIL_FROM: productionRequiredSecret(),
  CRON_SECRET: productionRequiredSecret(),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("ZYNTEKSIS"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const fullSchema = serverSchema.merge(clientSchema);

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
export type Env = z.infer<typeof fullSchema>;

const isServer = typeof window === "undefined";
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "true" ||
  process.env.SKIP_ENV_VALIDATION === "1";

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

function validate(): Env {
  if (skipValidation) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SKIP_ENV_VALIDATION is not allowed when NODE_ENV=production.",
      );
    }
    return process.env as unknown as Env;
  }

  const schema = isServer ? fullSchema : clientSchema;
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables:\n${formatIssues(parsed.error)}`,
    );
  }

  return parsed.data as Env;
}

let cache: Env | undefined;

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!isServer && !prop.startsWith("NEXT_PUBLIC_")) {
      throw new Error(
        `Attempted to access server-only environment variable "${prop}" on the client.`,
      );
    }

    if (!cache) {
      cache = validate();
    }

    return cache[prop as keyof Env];
  },
});
