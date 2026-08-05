import "server-only";

import { NotFoundError } from "@/lib/errors";
import { mapPostgrestError } from "@/lib/map-postgrest-error";
import { writeAdminAuditLog } from "@/services/admin/admin-audit.service";
import { assertAdminPermission } from "@/services/admin/permissions";
import type { AdminActionContext } from "@/services/admin/users-actions.service";
import { createSupabaseAdminClient } from "@/supabase/admin";

/** Revoke a single user session from the Enterprise Security Center. */
export async function revokeSessionAsAdmin(
  ctx: AdminActionContext,
  sessionId: string,
): Promise<void> {
  assertAdminPermission(ctx.actorRole, "admin:users:write");
  const admin = createSupabaseAdminClient();

  const { data: session, error } = await admin
    .from("user_sessions")
    .select("id, user_id, revoked_at, device_label, browser, ip_address")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw mapPostgrestError(error);
  if (!session) throw new NotFoundError("Session not found");
  if (session.revoked_at) return;

  const { error: updateError } = await admin
    .from("user_sessions")
    .update({
      revoked_at: new Date().toISOString(),
      is_current: false,
    })
    .eq("id", sessionId)
    .is("revoked_at", null);
  if (updateError) throw mapPostgrestError(updateError);

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", session.user_id)
    .maybeSingle();

  await writeAdminAuditLog({
    actorId: ctx.actorId,
    action: "user_force_logout",
    targetUserId: session.user_id,
    summary: `Revoked session for ${profile?.email ?? session.user_id}`,
    metadata: {
      sessionId,
      deviceLabel: session.device_label,
      browser: session.browser,
      ipAddress: session.ip_address,
      scope: "single_session",
    },
    ipAddress: ctx.ipAddress,
  });
}
