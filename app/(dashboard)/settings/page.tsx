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
import { dashboardPageMetadata } from "@/lib/i18n/dashboard-metadata";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export const generateMetadata = () => dashboardPageMetadata("settings");

const SECTION_KEYS = [
  "profile",
  "workspace",
  "team",
  "security",
  "notifications",
  "appearance",
  "ai",
  "api",
  "billing",
] as const;

const SECTION_META: Record<
  (typeof SECTION_KEYS)[number],
  { href: string; icon: LucideIcon }
> = {
  profile: { href: DASHBOARD_ROUTES.profile, icon: User },
  workspace: { href: DASHBOARD_ROUTES.organization, icon: Building2 },
  team: { href: DASHBOARD_ROUTES.members, icon: Users },
  security: { href: DASHBOARD_ROUTES.security, icon: Shield },
  notifications: { href: DASHBOARD_ROUTES.notifications, icon: Bell },
  appearance: { href: DASHBOARD_ROUTES.settingsAppearance, icon: Palette },
  ai: { href: DASHBOARD_ROUTES.settingsAi, icon: Bot },
  api: { href: DASHBOARD_ROUTES.settingsApi, icon: KeyRound },
  billing: { href: DASHBOARD_ROUTES.billing, icon: CreditCard },
};

export default async function SettingsPage() {
  const { dict } = await getDictionary();
  const titles = dict.dashboard.pageTitles.settings;
  const sectionCopy = dict.dashboard.settingsSections;

  const sections = SECTION_KEYS.map((key) => ({
    key,
    title: sectionCopy[key].title,
    description: sectionCopy[key].description,
    href: SECTION_META[key].href,
    icon: SECTION_META[key].icon,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={titles.title} description={titles.description} />
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
