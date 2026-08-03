import { AI } from "@/lib/constants";
import { env } from "@/lib/env";

/**
 * Central AI configuration. The default model is environment-driven so it can
 * be tuned per environment without code changes. Temperature is shared with
 * `AI.temperature` so chat and config stay in sync.
 */
export const aiConfig = {
  get defaultModel(): string {
    return env.OPENAI_MODEL;
  },
  get temperature(): number {
    return AI.temperature;
  },
} as const;
