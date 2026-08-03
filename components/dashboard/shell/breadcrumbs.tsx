"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { navItems } from "@/components/dashboard/shell/nav-config";

function titleize(segment: string): string {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface Crumb {
  label: string;
  href: string;
}

/**
 * Animated breadcrumb trail derived from the current path. Labels resolve from
 * the navigation config where possible and fall back to a titleized segment.
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: Crumb[] = [];
  let href = "";
  for (const segment of segments) {
    href += `/${segment}`;
    const navMatch = navItems.find((item) => item.href === href);
    crumbs.push({
      label: navMatch?.label ?? titleize(segment),
      href,
    });
  }

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 md:flex">
      <ol className="flex items-center gap-1 text-sm">
        <li>
          <Link
            href={DASHBOARD_ROUTES.dashboard}
            aria-label="Dashboard home"
            className="flex size-7 items-center justify-center rounded-lg text-zt-muted transition-colors hover:bg-white/[0.04] hover:text-zt-text"
          >
            <Home className="size-4" aria-hidden />
          </Link>
        </li>
        <AnimatePresence initial={false}>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <motion.li
                key={crumb.href}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-1"
              >
                <ChevronRight
                  className="size-3.5 shrink-0 text-zt-muted/50"
                  aria-hidden
                />
                {isLast ? (
                  <span
                    aria-current="page"
                    className="truncate font-medium text-zt-text"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="truncate text-zt-muted transition-colors hover:text-zt-text"
                  >
                    {crumb.label}
                  </Link>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </nav>
  );
}
