import { APP_NAME } from "@/lib/constants";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInviteEmail(input: {
  workspaceName: string;
  roleLabel: string;
  inviterEmail: string | null;
  acceptUrl: string;
}): { subject: string; html: string; text: string } {
  const workspace = escapeHtml(input.workspaceName);
  const role = escapeHtml(input.roleLabel);
  const inviter = input.inviterEmail
    ? escapeHtml(input.inviterEmail)
    : "A teammate";
  const url = escapeHtml(input.acceptUrl);
  const subject = `You're invited to ${input.workspaceName} on ${APP_NAME}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#050816;color:#e2e8f0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050816;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#0d1324;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <tr><td style="background:#00e5ff;padding:20px 28px;color:#041018;font-weight:700;font-size:18px;">${escapeHtml(APP_NAME)}</td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:22px;color:#ffffff;">Workspace invitation</h1>
          <p style="margin:0 0 16px;line-height:1.55;color:#cbd5e1;">
            ${inviter} invited you to join <strong style="color:#ffffff;">${workspace}</strong> as <strong style="color:#ffffff;">${role}</strong>.
          </p>
          <p style="margin:0 0 24px;line-height:1.55;color:#cbd5e1;">
            Sign in or create an account with this email address, then open Invitations to accept.
          </p>
          <a href="${url}" style="display:inline-block;background:#00e5ff;color:#041018;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;">
            View invitation
          </a>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;word-break:break-all;">
            Or paste this link: ${url}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    subject,
    "",
    `${inviter} invited you to join ${input.workspaceName} as ${input.roleLabel}.`,
    "",
    `Open: ${input.acceptUrl}`,
    "",
    `Sign in with the invited email, then accept from Invitations.`,
  ].join("\n");

  return { subject, html, text };
}
