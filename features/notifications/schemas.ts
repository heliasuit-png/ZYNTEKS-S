import { z } from "zod";

import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
} from "@/lib/constants";

const optionalWebhook = z
  .string()
  .trim()
  .url("Enter a valid webhook URL.")
  .or(z.literal(""))
  .optional();

const categoryChannelSchema = z.object({
  email: z.boolean(),
  dashboard: z.boolean(),
  slack: z.boolean(),
  discord: z.boolean(),
});

export const notificationPreferencesSchema = z.object({
  email_enabled: z.boolean(),
  dashboard_enabled: z.boolean(),
  slack_enabled: z.boolean(),
  slack_webhook_url: optionalWebhook,
  discord_enabled: z.boolean(),
  discord_webhook_url: optionalWebhook,
  type_preferences: z.record(
    z.enum(NOTIFICATION_CATEGORIES),
    categoryChannelSchema,
  ),
});

export type NotificationPreferencesValues = z.infer<
  typeof notificationPreferencesSchema
>;

export { NOTIFICATION_CHANNELS };
