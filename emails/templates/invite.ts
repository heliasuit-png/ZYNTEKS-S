import { APP_NAME } from "@/lib/constants";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type InviteEmailCopy = {
  subjectTemplate: string;
  teammateFallback: string;
  heading: string;
  invitedYou: string;
  asRole: string;
  instructions: string;
  cta: string;
  orPaste: string;
  textOpen: string;
  textSignIn: string;
};

export function renderInviteEmail(input: {
  workspaceName: string;
  roleLabel: string;
  inviterEmail: string | null;
  acceptUrl: string;
  copy: InviteEmailCopy;
}): { subject: string; html: string; text: string } {
  const workspace = escapeHtml(input.workspaceName);
  const role = escapeHtml(input.roleLabel);
  const inviterRaw = input.inviterEmail ?? input.copy.teammateFallback;
  const inviter = escapeHtml(inviterRaw);
  const url = escapeHtml(input.acceptUrl);
  const subject = input.copy.subjectTemplate
    .replaceAll("{workspace}", input.workspaceName)
    .replaceAll("{app}", APP_NAME);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#050816;color:#e2e8f0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050816;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#0d1324;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <tr><td style="background:#00e5ff;padding:20px 28px;color:#041018;font-weight:700;font-size:18px;">${escapeHtml(APP_NAME)}</td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:22px;color:#ffffff;">${escapeHtml(input.copy.heading)}</h1>
          <p style="margin:0 0 16px;line-height:1.55;color:#cbd5e1;">
            ${inviter} ${escapeHtml(input.copy.invitedYou)} <strong style="color:#ffffff;">${workspace}</strong> ${escapeHtml(input.copy.asRole)} <strong style="color:#ffffff;">${role}</strong>.
          </p>
          <p style="margin:0 0 24px;line-height:1.55;color:#cbd5e1;">
            ${escapeHtml(input.copy.instructions)}
          </p>
          <a href="${url}" style="display:inline-block;background:#00e5ff;color:#041018;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:10px;">
            ${escapeHtml(input.copy.cta)}
          </a>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;word-break:break-all;">
            ${escapeHtml(input.copy.orPaste)} ${url}
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
    `${inviterRaw} ${input.copy.invitedYou} ${input.workspaceName} ${input.copy.asRole} ${input.roleLabel}.`,
    "",
    `${input.copy.textOpen}: ${input.acceptUrl}`,
    "",
    input.copy.textSignIn,
  ].join("\n");

  return { subject, html, text };
}
