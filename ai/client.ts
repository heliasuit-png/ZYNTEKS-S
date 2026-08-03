import "server-only";

import OpenAI from "openai";

import { env } from "@/lib/env";

/**
 * Lazily instantiated singleton OpenAI client. Instantiation is deferred so the
 * API key is only read (and validated) when the client is actually used.
 */
let client: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return client;
}
