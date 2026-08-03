import { z } from "zod";

import { MAINTENANCE_STATUSES } from "@/lib/constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .optional()
    .or(z.literal(""));

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .or(z.literal(""))
  .optional();

const optionalEmail = z
  .string()
  .trim()
  .email("Enter a valid email.")
  .or(z.literal(""))
  .optional();

export const createStatusPageSchema = z.object({
  projectId: z.string().uuid("Select a project."),
  name: optionalText(80),
  slug: optionalText(60),
  description: optionalText(200),
  isPublic: z.boolean(),
});

export const updateStatusPageSchema = z.object({
  id: z.string().uuid("Invalid status page id."),
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(80, "Name must be 80 characters or fewer."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(60, "Slug must be 60 characters or fewer."),
  description: optionalText(200),
  isPublic: z.boolean(),
  logoUrl: optionalUrl,
  brandColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex color like #3B82F6.")
    .or(z.literal(""))
    .optional(),
  timezone: optionalText(64),
  contactEmail: optionalEmail,
  footerText: optionalText(240),
});

export const addComponentSchema = z.object({
  statusPageId: z.string().uuid("Invalid status page id."),
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(60, "Name must be 60 characters or fewer."),
  description: optionalText(200),
});

export const createMaintenanceSchema = z.object({
  statusPageId: z.string().uuid("Invalid status page id."),
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title must be 120 characters or fewer."),
  description: optionalText(400),
  status: z.enum(MAINTENANCE_STATUSES),
  scheduledStart: z.string().min(1, "Start time is required."),
  scheduledEnd: z.string().min(1, "End time is required."),
});

export const updateMaintenanceSchema = z.object({
  id: z.string().uuid("Invalid maintenance id."),
  status: z.enum(MAINTENANCE_STATUSES),
});
