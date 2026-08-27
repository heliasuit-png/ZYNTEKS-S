import { z } from "zod";

import { MAINTENANCE_STATUSES } from "@/lib/constants";

const optionalText = (max: number, code: string) =>
  z
    .string()
    .trim()
    .max(max, code)
    .optional()
    .or(z.literal(""));

const optionalUrl = z
  .string()
  .trim()
  .url("invalid_url")
  .or(z.literal(""))
  .optional();

const optionalEmail = z
  .string()
  .trim()
  .email("email_invalid")
  .or(z.literal(""))
  .optional();

export const createStatusPageSchema = z.object({
  projectId: z.string().uuid("select_project"),
  name: optionalText(80, "name_max_80"),
  slug: optionalText(60, "slug_max_60"),
  description: optionalText(200, "description_max_200"),
  isPublic: z.boolean(),
});

export const updateStatusPageSchema = z.object({
  id: z.string().uuid("invalid_status_page_id"),
  name: z
    .string()
    .trim()
    .min(1, "name_required")
    .max(80, "name_max_80"),
  slug: z
    .string()
    .trim()
    .min(1, "slug_required")
    .max(60, "slug_max_60"),
  description: optionalText(200, "description_max_200"),
  isPublic: z.boolean(),
  logoUrl: optionalUrl,
  brandColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "hex_color")
    .or(z.literal(""))
    .optional(),
  timezone: optionalText(64, "timezone_max"),
  contactEmail: optionalEmail,
  footerText: optionalText(240, "footer_max_240"),
});

export const addComponentSchema = z.object({
  statusPageId: z.string().uuid("invalid_status_page_id"),
  name: z
    .string()
    .trim()
    .min(1, "name_required")
    .max(60, "name_max_60"),
  description: optionalText(200, "description_max_200"),
});

export const createMaintenanceSchema = z.object({
  statusPageId: z.string().uuid("invalid_status_page_id"),
  title: z
    .string()
    .trim()
    .min(1, "title_required")
    .max(120, "title_max_120"),
  description: optionalText(400, "description_max_400"),
  status: z.enum(MAINTENANCE_STATUSES),
  scheduledStart: z.string().min(1, "start_required"),
  scheduledEnd: z.string().min(1, "end_required"),
});

export const updateMaintenanceSchema = z.object({
  id: z.string().uuid("invalid_maintenance_id"),
  status: z.enum(MAINTENANCE_STATUSES),
});
