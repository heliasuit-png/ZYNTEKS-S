import "server-only";

import { Resend } from "resend";

import { env } from "@/lib/env";

/**
 * Lazily instantiated singleton Resend client for transactional email.
 */
let client: Resend | undefined;

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(env.RESEND_API_KEY);
  }
  return client;
}

/** Default `from` address used for all outbound email. */
export function getDefaultFromAddress(): string {
  return env.EMAIL_FROM;
}
