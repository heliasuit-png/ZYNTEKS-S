import Link from "next/link";
import type { Metadata } from "next";

import { ADMIN_ROUTES, ROUTES } from "@/lib/constants";
import { getPlatformRuntimeSettings } from "@/services/platform/runtime-settings.service";

export const metadata: Metadata = {
  title: "Maintenance",
};

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const settings = await getPlatformRuntimeSettings();

  if (!settings.maintenanceEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Platform is online
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Maintenance mode is not active.
          </p>
          <Link
            href={ROUTES.dashboard}
            className="mt-6 inline-block text-sm text-violet-300 hover:underline"
          >
            Continue to dashboard
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
          Scheduled maintenance
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          {settings.maintenanceMessage?.trim() ||
            "The product dashboard is temporarily unavailable while we perform platform maintenance."}
        </p>
        <p className="mt-8 text-xs text-zinc-500">
          Platform operators can continue via{" "}
          <Link
            href={ADMIN_ROUTES.login}
            className="text-violet-300 hover:underline"
          >
            Admin Control Center
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
