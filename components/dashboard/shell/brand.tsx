import Link from "next/link";

import { APP_NAME, DASHBOARD_ROUTES } from "@/lib/constants";
import { LogoMark } from "@/components/brand/logo-mark";

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href={DASHBOARD_ROUTES.dashboard}
      className="group flex items-center gap-2.5 font-semibold tracking-tight text-zt-text"
      aria-label={APP_NAME}
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-zt-border bg-white/[0.03] shadow-lg shadow-zt-primary/20 transition-transform duration-300 group-hover:scale-105">
        <LogoMark size={26} />
        <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </span>
      {collapsed ? null : (
        <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}
