import { z } from "zod";

import { AI } from "@/lib/constants";

export const chatRequestSchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    projectId: z.string().uuid().nullish(),
    message: z.string().max(AI.maxMessageChars).optional(),
    regenerate: z.boolean().optional().default(false),
  })
  .refine(
    (value) =>
      value.regenerate === true ||
      (typeof value.message === "string" && value.message.trim().length > 0),
    { message: "A message is required.", path: ["message"] },
  );

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const renameConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
});

export const conversationIdSchema = z.object({
  id: z.string().uuid(),
});

export const pinConversationSchema = z.object({
  id: z.string().uuid(),
  pinned: z.coerce.boolean(),
});

export const feedbackSchema = z.object({
  messageId: z.string().uuid(),
  rating: z.enum(["up", "down"]),
});

export const setConversationProjectSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid().nullable(),
});
