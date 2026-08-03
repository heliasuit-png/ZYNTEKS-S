/**
 * Starter prompts for the AI Analysis Engine.
 *
 * `SUGGESTED_ANALYSES` powers the suggested-prompt chips shown in the empty
 * chat state. `INTENT_PROMPTS` maps the `?intent=` deep-links used by the
 * dashboard AI Core action cards to a concrete starter prompt.
 */

export interface SuggestedAnalysis {
  /** Deep-link intent key (also used by the dashboard AI Core cards). */
  intent: string;
  label: string;
  prompt: string;
}

export const SUGGESTED_ANALYSES: SuggestedAnalysis[] = [
  {
    intent: "analyze-project",
    label: "Analyze Project",
    prompt:
      "Analyze my project's overall health and give me a prioritized, evidence-based action plan.",
  },
  {
    intent: "analyze-error",
    label: "Analyze Error",
    prompt:
      "Analyze my most frequent recent error: likely root cause, the evidence behind it, recommended checks and fixes, and your confidence.",
  },
  {
    intent: "analyze-incident",
    label: "Analyze Incident",
    prompt:
      "Analyze my most recent incident — likely cause, contributing factors, and recovery steps.",
  },
  {
    intent: "performance-audit",
    label: "Analyze Performance",
    prompt:
      "Review my performance metrics (page load, LCP, CLS, INP, TTFB) and recommend improvements with trade-offs.",
  },
  {
    intent: "analyze-api",
    label: "Analyze API",
    prompt:
      "Review my API usage and error patterns for reliability, latency and rate-limiting concerns.",
  },
  {
    intent: "analyze-logs",
    label: "Analyze Logs",
    prompt:
      "Analyze my recent error and event patterns and highlight anything unusual or trending.",
  },
  {
    intent: "analyze-stack-trace",
    label: "Analyze Stack Trace",
    prompt:
      "I'll paste a stack trace. Help me find the likely root cause and the files probably responsible:\n\n```\n\n```",
  },
  {
    intent: "analyze-sdk-events",
    label: "Analyze SDK Events",
    prompt:
      "Analyze my recent SDK events and heartbeat quality for anomalies or gaps.",
  },
  {
    intent: "deployment-review",
    label: "Deployment Review",
    prompt:
      "Assess deployment readiness and risks based on my current health signals.",
  },
  {
    intent: "security-scan",
    label: "Security Scan",
    prompt:
      "Run a security review covering API exposure, key leakage, rate limiting, authentication, missing headers and potential vulnerabilities.",
  },
  {
    intent: "review-architecture",
    label: "Architecture Review",
    prompt:
      "Review my project architecture and suggest improvements to structure, folder organization, maintainability and scalability.",
  },
  {
    intent: "database-review",
    label: "Database Review",
    prompt:
      "Review likely database concerns — latency, query patterns and indexing — based on the available signals.",
  },
];

export const INTENT_PROMPTS: Record<string, string> = Object.fromEntries(
  SUGGESTED_ANALYSES.map((a) => [a.intent, a.prompt]),
);

/** Resolves a deep-link intent to its starter prompt, if known. */
export function promptForIntent(intent: string | undefined): string | null {
  if (!intent) return null;
  return INTENT_PROMPTS[intent] ?? null;
}
