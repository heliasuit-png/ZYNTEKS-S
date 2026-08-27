import {
  Activity,
  Bell,
  Bug,
  BrainCircuit,
  Building2,
  CreditCard,
  FolderKanban,
  Globe,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  Siren,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DASHBOARD_ROUTES } from "@/lib/constants";
import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries";

export type DashboardNavKey = keyof Dictionary["dashboardNav"];

export interface NavItemDef {
  key: DashboardNavKey;
  href: string;
  icon: LucideIcon;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItemDefs: NavItemDef[] = [
  { key: "dashboard", href: DASHBOARD_ROUTES.dashboard, icon: LayoutDashboard },
  { key: "projects", href: DASHBOARD_ROUTES.projects, icon: FolderKanban },
  { key: "apiKeys", href: DASHBOARD_ROUTES.apiKeys, icon: KeyRound },
  { key: "errors", href: DASHBOARD_ROUTES.errors, icon: Bug },
  { key: "incidents", href: DASHBOARD_ROUTES.incidents, icon: Siren },
  { key: "health", href: DASHBOARD_ROUTES.health, icon: Activity },
  { key: "insights", href: DASHBOARD_ROUTES.insights, icon: BrainCircuit },
  { key: "ai", href: DASHBOARD_ROUTES.aiAssistant, icon: Sparkles },
  { key: "notifications", href: DASHBOARD_ROUTES.notifications, icon: Bell },
  { key: "statusPages", href: DASHBOARD_ROUTES.statusPages, icon: Globe },
  { key: "members", href: DASHBOARD_ROUTES.members, icon: Users },
  { key: "audit", href: DASHBOARD_ROUTES.audit, icon: ScrollText },
  { key: "security", href: DASHBOARD_ROUTES.security, icon: Shield },
  { key: "organization", href: DASHBOARD_ROUTES.organization, icon: Building2 },
  { key: "billing", href: DASHBOARD_ROUTES.billing, icon: CreditCard },
  { key: "settings", href: DASHBOARD_ROUTES.settings, icon: Settings },
  { key: "profile", href: DASHBOARD_ROUTES.profile, icon: User },
];

export function resolveNavItems(
  labels: Dictionary["dashboardNav"],
): NavItem[] {
  return navItemDefs.map((item) => ({
    href: item.href,
    icon: item.icon,
    label: labels[item.key],
  }));
}

/**
 * English fallback for client modules that mount before labels are injected.
 * Runtime navigation should use `resolveNavItems(dict.dashboardNav)`.
 */
export const navItems: NavItem[] = resolveNavItems(
  dictionaries.en.dashboardNav,
);
