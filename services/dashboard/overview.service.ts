import { getDashboardStats } from "@/services/dashboard/stats.service";
import { getRecentActivity } from "@/services/dashboard/activity.service";
import { getRecentErrors } from "@/services/dashboard/errors.service";
import { getRecentNotifications } from "@/services/dashboard/notifications.service";
import { getRecentConversations } from "@/services/dashboard/conversations.service";
import { getSystemStatus } from "@/services/dashboard/system-status.service";
import type { DashboardOverview } from "@/types/dashboard";

/**
 * Aggregates all data needed to render the dashboard home in a single call.
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [
    stats,
    recentActivity,
    recentErrors,
    recentNotifications,
    recentConversations,
    systemStatus,
  ] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
    getRecentErrors(),
    getRecentNotifications(),
    getRecentConversations(),
    getSystemStatus(),
  ]);

  return {
    stats,
    recentActivity,
    recentErrors,
    recentNotifications,
    recentConversations,
    systemStatus,
  };
}
