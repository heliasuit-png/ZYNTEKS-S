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

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: DASHBOARD_ROUTES.dashboard, icon: LayoutDashboard },
  { label: "Projects", href: DASHBOARD_ROUTES.projects, icon: FolderKanban },
  { label: "API Keys", href: DASHBOARD_ROUTES.apiKeys, icon: KeyRound },
  { label: "Error Monitoring", href: DASHBOARD_ROUTES.errors, icon: Bug },
  { label: "Incidents", href: DASHBOARD_ROUTES.incidents, icon: Siren },
  { label: "Health Monitor", href: DASHBOARD_ROUTES.health, icon: Activity },
  { label: "Intelligence", href: DASHBOARD_ROUTES.insights, icon: BrainCircuit },
  { label: "AI Assistant", href: DASHBOARD_ROUTES.aiAssistant, icon: Sparkles },
  { label: "Notifications", href: DASHBOARD_ROUTES.notifications, icon: Bell },
  { label: "Status Pages", href: DASHBOARD_ROUTES.statusPages, icon: Globe },
  { label: "Members", href: DASHBOARD_ROUTES.members, icon: Users },
  { label: "Audit Log", href: DASHBOARD_ROUTES.audit, icon: ScrollText },
  { label: "Security Center", href: DASHBOARD_ROUTES.security, icon: Shield },
  { label: "Organization", href: DASHBOARD_ROUTES.organization, icon: Building2 },
  { label: "Billing", href: DASHBOARD_ROUTES.billing, icon: CreditCard },
  { label: "Settings", href: DASHBOARD_ROUTES.settings, icon: Settings },
  { label: "Profile", href: DASHBOARD_ROUTES.profile, icon: User },
];
