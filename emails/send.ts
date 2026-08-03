import "server-only";

import { getDefaultFromAddress, getResendClient } from "@/emails/client";
import { logger } from "@/lib/logger";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id: string | null;
  error?: string;
}

/**
 * Sends a transactional email through Resend. Failures are returned (not
 * thrown) so callers can record delivery status without aborting a batch.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: getDefaultFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? "",
    });

    if (error) {
      logger.warn("Email delivery failed", { error: error.message });
      return { ok: false, id: null, error: error.message };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    logger.warn("Email delivery threw", { error: message });
    return { ok: false, id: null, error: message };
  }
}
