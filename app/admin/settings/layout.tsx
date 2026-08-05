import type { ReactNode } from "react";

import { AdminShell } from "@/features/admin";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export default async function AdminSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdminSession();

  return <AdminShell user={user}>{children}</AdminShell>;
}
