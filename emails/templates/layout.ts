import type { NotificationType } from "@/types/database";
import type { EmailDetail } from "@/emails/types";

/** Accent color per notification type, used for the header and CTA button. */
const ACCENT: Record<NotificationType, string> = {
  incident_created: "#EF4444",
  incident_resolved: "#22C55E",
  critical_error: "#EF4444",
  api_key_revoked: "#F59E0B",
  project_created: "#3B82F6",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailLayoutInput {
  type: NotificationType;
  appName: string;
  heading: string;
  intro: string;
  details?: EmailDetail[];
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Renders a responsive, email-client-safe HTML document using inline styles.
 * Layout is a centered card with a colored header, a details table and an
 * optional call-to-action button.
 */
export function renderEmailLayout(input: EmailLayoutInput): string {
  const accent = ACCENT[input.type];
  const year = new Date().getFullYear();

  const detailsRows = (input.details ?? [])
    .map(
      (detail) => `
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%;vertical-align:top;">${escapeHtml(
            detail.label,
          )}</td>
          <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600;vertical-align:top;">${escapeHtml(
            detail.value,
          )}</td>
        </tr>`,
    )
    .join("");

  const detailsBlock = detailsRows
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:20px 0;">${detailsRows}</table>`
    : "";

  const ctaBlock =
    input.actionUrl && input.actionLabel
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td style="border-radius:10px;background:${accent};">
              <a href="${escapeHtml(input.actionUrl)}" target="_blank" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(
                input.actionLabel,
              )}</a>
            </td>
          </tr>
        </table>`
      : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(input.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:${accent};padding:20px 28px;">
                <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.02em;">${escapeHtml(
                  input.appName,
                )}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#111827;">${escapeHtml(
                  input.heading,
                )}</h1>
                <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${escapeHtml(
                  input.intro,
                )}</p>
                ${detailsBlock}
                ${ctaBlock}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                  You are receiving this email because notifications are enabled for your ${escapeHtml(
                    input.appName,
                  )} account. Manage your preferences in the dashboard.
                </p>
                <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">&copy; ${year} ${escapeHtml(
                  input.appName,
                )}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
