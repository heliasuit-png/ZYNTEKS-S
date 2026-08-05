"use server";

import { isAppError } from "@/lib/errors";
import { getAuditEventDetail } from "@/services/admin/audit-center.service";
import type { AuditEventDetail } from "@/services/admin/audit-center.types";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export async function loadAuditEventDetailAction(
  eventId: string,
): Promise<AuditEventDetail> {
  const session = await requireAdminSession();
  try {
    return await getAuditEventDetail(session.admin.role, eventId);
  } catch (error) {
    if (isAppError(error)) throw error;
    throw new Error("Failed to load audit event");
  }
}
