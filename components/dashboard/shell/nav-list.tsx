"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { navItems } from "@/components/dashboard/shell/nav-config";

interface NavListProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function NavList({ onNavigate, collapsed = false }: NavListProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              isActive
                ? "text-zt-text"
                : "text-zt-muted hover:text-zt-text",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="zt-nav-active"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-xl border border-zt-primary/40 bg-gradient-to-r from-zt-primary/25 via-zt-secondary/15 to-transparent shadow-[0_0_24px_-4px_var(--color-zt-primary),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                aria-hidden
              />
            ) : (
              <span className="absolute inset-0 rounded-xl bg-white/0 transition-colors group-hover:bg-white/[0.04]" />
            )}

            {/* Active accent bar */}
            {isActive && !collapsed ? (
              <motion.span
                layoutId="zt-nav-bar"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-zt-primary shadow-[0_0_10px_var(--color-zt-primary)]"
                aria-hidden
              />
            ) : null}

            <Icon
              className={cn(
                "relative z-10 size-4 shrink-0 transition-transform duration-300 group-hover:scale-110",
                isActive && "text-zt-primary",
              )}
              style={
                isActive
                  ? { filter: "drop-shadow(0 0 6px var(--color-zt-primary))" }
                  : undefined
              }
              aria-hidden
            />
            {collapsed ? null : (
              <span className="relative z-10 truncate">{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
