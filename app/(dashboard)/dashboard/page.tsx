import type { Metadata } from "next";

import { FadeIn } from "@/components/dashboard/motion";
import { Onboarding } from "@/components/dashboard/onboarding/onboarding";
import { DashboardHero } from "@/components/dashboard/home/hero";
import { AiCore } from "@/components/dashboard/home/ai-core";
import { SystemHealthBar } from "@/components/dashboard/home/system-health-bar";
import { StatsGrid } from "@/components/dashboard/home/stats-grid";
import { QuickActions } from "@/components/dashboard/home/quick-actions";
import { LiveActivityFeed } from "@/components/dashboard/home/live-activity-feed";
import { AiInsightsPanel } from "@/components/dashboard/home/ai-insights-panel";
import { SystemHealthGauges } from "@/components/dashboard/home/system-health-gauges";
import { WorldMap } from "@/components/dashboard/home/world-map";
import { RecentErrors } from "@/components/dashboard/home/recent-errors";
import { RecentNotifications } from "@/components/dashboard/home/recent-notifications";
import { RecentConversations } from "@/components/dashboard/home/recent-conversations";
import { SystemStatusPanel } from "@/components/dashboard/home/system-status";
import { getDashboardOverview } from "@/services/dashboard";
import { getAuthenticatedUser } from "@/services/auth";
import { getProfileById } from "@/services/profile";
import {
  getWorkspaceUsage,
  resolveActiveWorkspace,
} from "@/services/workspace";
import { createSupabaseServerClient } from "@/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

function firstName(fullName: string | null, email: string): string {
  const name = fullName?.trim();
  if (name) {
    return name.split(/\s+/)[0] ?? "";
  }
  const local = email.split("@")[0] ?? "";
  if (!local) return "";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default async function DashboardPage() {
  const overview = await getDashboardOverview();

  // Read-only lookup of the signed-in user for a personalised hero.
  let userName = "";
  let planLabel = "Starter";
  let workspaceLabel = `${planLabel} workspace`;
  let workspaceUsage: {
    memberCount: number;
    projectCount: number;
    apiKeyCount: number;
    aiMessageCount: number;
  } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser(supabase);
    if (user) {
      userName = firstName(null, user.email ?? "");
      try {
        const profile = await getProfileById(supabase, user.id);
        userName = firstName(profile.full_name, user.email ?? "");
        planLabel = PLAN_LABELS[profile.subscription_plan] ?? planLabel;
      } catch {
        // Profile not ready yet; fall back to the email-derived name.
      }
      try {
        const { active } = await resolveActiveWorkspace(
          supabase,
          user.id,
          user.email,
        );
        planLabel = PLAN_LABELS[active.plan] ?? planLabel;
        workspaceLabel = active.name;
        workspaceUsage = await getWorkspaceUsage(supabase, active.id);
      } catch {
        // Workspace not ready; keep personalised fallbacks.
      }
    }
  } catch {
    // Auth lookup unavailable; render a non-personalised hero.
  }

  const { stats, systemStatus } = overview;

  return (
    <div className="space-y-6">
      <Onboarding />

      <DashboardHero
        userName={userName}
        workspaceLabel={workspaceLabel}
        stats={stats}
        overall={systemStatus.overall}
      />

      {workspaceUsage ? (
        <FadeIn>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <WorkspaceStat label="Members" value={workspaceUsage.memberCount} />
            <WorkspaceStat label="Projects" value={workspaceUsage.projectCount} />
            <WorkspaceStat label="API usage" value={workspaceUsage.apiKeyCount} />
            <WorkspaceStat label="AI usage (30d)" value={workspaceUsage.aiMessageCount} />
            <WorkspaceStat
              label="Health"
              value={stats.healthScore}
              suffix="%"
            />
          </div>
        </FadeIn>
      ) : null}

      <SystemHealthBar
        overall={systemStatus.overall}
        openIncidents={stats.openIncidents}
        errorsToday={stats.errorsToday}
      />

      <FadeIn delay={0.05}>
        <AiCore stats={stats} overall={systemStatus.overall} />
      </FadeIn>

      <StatsGrid stats={stats} />

      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn delay={0.05} className="lg:col-span-2">
          <LiveActivityFeed activity={overview.recentActivity} />
        </FadeIn>
        <FadeIn delay={0.1}>
          <AiInsightsPanel stats={stats} />
        </FadeIn>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn delay={0.05} className="lg:col-span-2">
          <SystemHealthGauges stats={stats} overall={systemStatus.overall} />
        </FadeIn>
        <FadeIn delay={0.1}>
          <QuickActions />
        </FadeIn>
      </div>

      <FadeIn delay={0.05}>
        <WorldMap />
      </FadeIn>

      <div className="grid gap-4 lg:grid-cols-2">
        <FadeIn delay={0.05}>
          <RecentErrors errors={overview.recentErrors} />
        </FadeIn>
        <FadeIn delay={0.1}>
          <RecentNotifications notifications={overview.recentNotifications} />
        </FadeIn>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FadeIn delay={0.05}>
          <RecentConversations conversations={overview.recentConversations} />
        </FadeIn>
        <FadeIn delay={0.1}>
          <SystemStatusPanel status={systemStatus} />
        </FadeIn>
      </div>
    </div>
  );
}

function WorkspaceStat({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="zt-card rounded-2xl border border-zt-border px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zt-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-zt-text">
        {value}
        {suffix}
      </p>
    </div>
  );
}
