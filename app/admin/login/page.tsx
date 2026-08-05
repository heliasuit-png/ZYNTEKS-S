import type { Metadata } from "next";

import { AdminLoginForm } from "@/features/admin";
import { redirectIfAdminSession } from "@/features/admin/load-admin-session";

export const metadata: Metadata = {
  title: "Admin Sign In · ZYNTEKSIS",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  await redirectIfAdminSession();

  const params = await searchParams;
  const redirectTo =
    typeof params.redirect === "string" ? params.redirect : undefined;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.14),_transparent_60%)]"
      />
      <AdminLoginForm redirectTo={redirectTo} />
    </div>
  );
}
