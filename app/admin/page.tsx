import { redirect } from "next/navigation";

import { ADMIN_ROUTES } from "@/lib/constants";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export default async function AdminIndexPage() {
  await requireAdminSession();
  redirect(ADMIN_ROUTES.dashboard);
}
