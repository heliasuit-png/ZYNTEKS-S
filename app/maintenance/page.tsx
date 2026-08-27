import Link from "next/link";
import type { Metadata } from "next";

import { ADMIN_ROUTES, ROUTES } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getPlatformRuntimeSettings } from "@/services/platform/runtime-settings.service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.system.maintenanceTitle };
}

export default async function MaintenancePage() {
  const { dict } = await getDictionary();
  const { system } = dict;
  const settings = await getPlatformRuntimeSettings();

  if (!settings.maintenanceEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {system.maintenanceInactive}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {system.maintenanceActive}
          </p>
          <Link
            href={ROUTES.dashboard}
            className="mt-6 inline-block text-sm text-violet-300 hover:underline"
          >
            {system.continueDashboard}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <div className="max-w-lg text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300/80">
          {settings.platformName}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {system.scheduledMaintenance}
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          {settings.maintenanceMessage?.trim() || system.maintenanceDesc}
        </p>
        <p className="mt-8 text-xs text-zinc-500">
          {system.operatorsContinue}{" "}
          <Link
            href={ADMIN_ROUTES.login}
            className="text-violet-300 hover:underline"
          >
            {system.adminControlCenter}
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
