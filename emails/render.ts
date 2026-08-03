import { renderEmailLayout } from "@/emails/templates/layout";
import type { EmailContent, NotificationEmailInput } from "@/emails/types";

/**
 * Renders a notification email into HTML + plain-text parts. The visual
 * template is shared; per-type styling is applied via the accent color.
 */
export function renderNotificationEmail(
  input: NotificationEmailInput,
): EmailContent {
  const html = renderEmailLayout({
    type: input.type,
    appName: input.appName,
    heading: input.heading,
    intro: input.intro,
    details: input.details,
    actionUrl: input.actionUrl,
    actionLabel: input.actionLabel,
  });

  const lines = [input.heading, "", input.intro];
  if (input.details && input.details.length > 0) {
    lines.push("");
    for (const detail of input.details) {
      lines.push(`${detail.label}: ${detail.value}`);
    }
  }
  if (input.actionUrl) {
    lines.push("", `${input.actionLabel ?? "Open"}: ${input.actionUrl}`);
  }

  return { subject: input.subject, html, text: lines.join("\n") };
}
