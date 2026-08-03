import type { EmailDetail } from "@/emails/types";
import type { NotificationCategory } from "@/lib/constants";
import type {
  Database,
  IncidentSeverity,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationLevel,
  NotificationType,
} from "@/types/database";

export type NotificationPreferences =
  Database["public"]["Tables"]["notification_preferences"]["Row"];
export type NotificationLog =
  Database["public"]["Tables"]["notification_logs"]["Row"];
export type NotificationQueueRow =
  Database["public"]["Tables"]["notification_queue"]["Row"];

/** Per-type context supplied by the engines when raising a notification. */
export type NotificationContext =
  | {
      type: "incident_created";
      projectName: string;
      incidentId: string;
      incidentTitle: string;
      severity: IncidentSeverity;
      startedAt: string;
    }
  | {
      type: "incident_resolved";
      projectName: string;
      incidentId: string;
      incidentTitle: string;
      durationText: string;
      resolvedAt: string;
    }
  | {
      type: "critical_error";
      projectName: string;
      errorId: string;
      message: string;
      occurredAt: string;
      url?: string | null;
    }
  | {
      type: "api_key_revoked";
      projectName: string;
      keyId: string;
      keyName: string;
      keyPrefix: string;
      revokedAt: string;
    }
  | {
      type: "project_created";
      projectName: string;
      projectId: string;
      framework?: string | null;
      createdAt: string;
    };

export type NotificationEvent = {
  userId: string;
  projectId?: string | null;
} & NotificationContext;

/** The presentation-ready content derived from an event by the composer. */
export interface ComposedNotification {
  type: NotificationType;
  level: NotificationLevel;
  title: string;
  body: string;
  details: EmailDetail[];
  actionPath: string;
  actionLabel: string;
  /** Deduplication key stored in `data` (unique per source entity). */
  dedupeKey: string;
  dedupeValue: string;
  data: Record<string, unknown>;
}

/** The dashboard-facing in-app notification shape. */
export interface DashboardNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  level: NotificationLevel;
  title: string;
  body: string;
  projectId: string | null;
  projectName: string | null;
  read: boolean;
  archived: boolean;
  status: NotificationDeliveryStatus;
  error: string | null;
  createdAt: string;
}

export interface NotificationCounts {
  unread: number;
  read: number;
  archived: number;
  total: number;
}

export interface DeliveryActivityItem {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  channel: NotificationChannel;
  level: NotificationLevel;
  title: string;
  status: NotificationDeliveryStatus;
  error: string | null;
  createdAt: string;
}

export interface RetryQueueItem {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  channel: NotificationChannel;
  title: string;
  status: NotificationDeliveryStatus;
  attempts: number;
  lastError: string | null;
  scheduledFor: string;
  createdAt: string;
}
