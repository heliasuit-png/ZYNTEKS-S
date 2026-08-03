import type { NotificationType } from "@/types/database";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface EmailDetail {
  label: string;
  value: string;
}

/**
 * Structured input for a transactional notification email. The notification
 * engine composes these fields; the renderer applies type-specific styling.
 */
export interface NotificationEmailInput {
  type: NotificationType;
  subject: string;
  heading: string;
  intro: string;
  details?: EmailDetail[];
  actionUrl?: string;
  actionLabel?: string;
  appName: string;
}
