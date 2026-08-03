"use client";

import Link from "next/link";
import {
  ChevronDown,
  CreditCard,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Dropdown, dropdownItemClass } from "@/components/dashboard/dropdown";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { signOutAction } from "@/features/auth/actions";
import type { DashboardUser } from "@/features/dashboard/types";

function getInitials(user: DashboardUser): string {
  const source = user.fullName?.trim() || user.email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function UserDropdown({ user }: { user: DashboardUser }) {
  const displayName = user.fullName?.trim() || user.email;

  return (
    <Dropdown
      align="end"
      menuClassName="w-60"
      trigger={
        <span className="flex items-center gap-2 rounded-xl border border-zt-border bg-white/[0.02] px-2 py-1.5 text-sm text-zt-text transition-colors hover:border-zt-border-strong">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-zt-primary to-zt-secondary text-xs font-semibold text-white">
            {getInitials(user)}
          </span>
          <span className="hidden max-w-32 truncate sm:block">
            {displayName}
          </span>
          <ChevronDown className="size-4 text-zt-muted" aria-hidden />
        </span>
      }
    >
      <div className="border-b border-zt-border px-3 py-2">
        <p className="truncate text-sm font-medium text-zt-text">
          {displayName}
        </p>
        <p className="truncate text-xs text-zt-muted">{user.email}</p>
      </div>
      <div className="py-1">
        <Link href={DASHBOARD_ROUTES.profile} className={dropdownItemClass}>
          <UserIcon className="size-4" aria-hidden />
          Profile
        </Link>
        <Link href={DASHBOARD_ROUTES.settings} className={dropdownItemClass}>
          <SettingsIcon className="size-4" aria-hidden />
          Settings
        </Link>
        <Link href={DASHBOARD_ROUTES.billing} className={dropdownItemClass}>
          <CreditCard className="size-4" aria-hidden />
          Billing
        </Link>
      </div>
      <div className="border-t border-zt-border pt-1">
        <form action={signOutAction}>
          <button
            type="submit"
            className={cn(dropdownItemClass, "text-zt-danger hover:text-zt-danger")}
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </Dropdown>
  );
}
