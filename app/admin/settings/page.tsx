import type { Metadata } from "next";

import { getPlatformSettingsCenter } from "@/services/admin/platform-settings.service";
import { AdminContainer } from "@/features/admin";
import { PlatformSettingsCenter } from "@/features/admin/components/settings/platform-settings-center";
import { requireAdminSession } from "@/features/admin/load-admin-session";

export const metadata: Metadata = {
  title: "Platform Settings · ZYNTEKSIS Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireAdminSession();
  const data = await getPlatformSettingsCenter(session.admin.role);

  return (
    <AdminContainer>
      <PlatformSettingsCenter data={data} role={session.admin.role} />
    </AdminContainer>
  );
}
