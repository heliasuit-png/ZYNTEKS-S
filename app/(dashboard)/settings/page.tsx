import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  Bot,
  Building2,
  ChevronRight,
  CreditCard,
  KeyRound,
  Palette,
  Shield,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import { DASHBOARD_ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Settings" };

const sections: Array<{
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}> = [
  {
    title: "Profile",
    description: "Avatar, display name, email, password, language and timezone.",
    href: DASHBOARD_ROUTES.profile,
    icon: User,
  },
  {
    title: "Workspace",
    description: "Name, logo, brand color, timezone, URL and ownership.",
    href: DASHBOARD_ROUTES.organization,
    icon: Building2,
  },
  {
    title: "Team",
    description: "Members, roles, invitations and permissions.",
    href: DASHBOARD_ROUTES.members,
    icon: Users,
  },
  {
    title: "Security",
    description: "Sessions, devices, recent logins and 2FA policy.",
    href: DASHBOARD_ROUTES.security,
    icon: Shield,
  },
  {
    title: "Notifications",
    description: "Email, dashboard, Slack, Discord and per-category prefs.",
    href: DASHBOARD_ROUTES.notifications,
    icon: Bell,
  },
  {
    title: "Appearance",
    description: "Dark/light/system theme, accent, motion, sidebar and density.",
    href: DASHBOARD_ROUTES.settingsAppearance,
    icon: Palette,
  },
  {
    title: "AI settings",
    description: "Usage, history, default model and streaming.",
    href: DASHBOARD_ROUTES.settingsAi,
    icon: Bot,
  },
  {
    title: "API settings",
    description: "API keys, SDK keys, webhooks and rate limits.",
    href: DASHBOARD_ROUTES.settingsApi,
    icon: KeyRound,
  },
  {
    title: "Billing",
    description: "Current plan, usage and subscription management.",
    href: DASHBOARD_ROUTES.billing,
    icon: CreditCard,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, workspace, security and preferences."
      />
      <div className="grid gap-3">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <FadeIn key={section.href} delay={index * 0.03}>
              <Link href={section.href}>
                <Panel className="flex items-center justify-between px-5 py-4 transition-colors hover:border-zt-primary/40">
                  <div className="flex items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-zt-primary/15 text-zt-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zt-text">
                        {section.title}
                      </p>
                      <p className="text-sm text-zt-muted">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-zt-muted" aria-hidden />
                </Panel>
              </Link>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
