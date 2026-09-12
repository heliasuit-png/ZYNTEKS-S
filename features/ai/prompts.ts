/**
 * Starter prompts for the AI Analysis Engine.
 *
 * `SUGGESTED_ANALYSES` powers the suggested-prompt chips shown in the empty
 * chat state. `INTENT_PROMPTS` maps the `?intent=` deep-links used by the
 * dashboard AI Core action cards to a concrete starter prompt.
 *
 * Prompt bodies follow the active UI locale (`en` | `tr`). Chip labels come
 * from `dict.dash.ai.prompts` via `promptLabelForIntent`.
 */

import type { Locale } from "@/lib/i18n/config";
import type { DashDictionary } from "@/lib/i18n/dictionaries/dash-types";

export interface SuggestedAnalysis {
  /** Deep-link intent key (also used by the dashboard AI Core cards). */
  intent: string;
  /** English fallback label; prefer `promptLabelForIntent` in UI. */
  label: string;
  prompt: string;
}

type AiPromptLabels = DashDictionary["ai"]["prompts"];

const INTENT_LABEL_KEYS: Record<string, keyof AiPromptLabels> = {
  "analyze-project": "analyzeProject",
  "analyze-error": "analyzeError",
  "analyze-incident": "analyzeIncident",
  "performance-audit": "analyzePerformance",
  "analyze-api": "analyzeApi",
  "analyze-logs": "analyzeLogs",
  "analyze-stack-trace": "analyzeStackTrace",
  "analyze-sdk-events": "analyzeSdkEvents",
  "deployment-review": "deploymentReview",
  "security-scan": "securityScan",
  "review-architecture": "architectureReview",
  "database-review": "databaseReview",
};

const PROMPT_BODIES_EN: Record<string, string> = {
  "analyze-project":
    "Analyze my project's overall health and give me a prioritized, evidence-based action plan.",
  "analyze-error":
    "Analyze my most frequent recent error: likely root cause, the evidence behind it, recommended checks and fixes, and your confidence.",
  "analyze-incident":
    "Analyze my most recent incident — likely cause, contributing factors, and recovery steps.",
  "performance-audit":
    "Review my performance metrics (page load, LCP, CLS, INP, TTFB) and recommend improvements with trade-offs.",
  "analyze-api":
    "Review my API usage and error patterns for reliability, latency and rate-limiting concerns.",
  "analyze-logs":
    "Analyze my recent error and event patterns and highlight anything unusual or trending.",
  "analyze-stack-trace":
    "I'll paste a stack trace. Help me find the likely root cause and the files probably responsible:\n\n```\n\n```",
  "analyze-sdk-events":
    "Analyze my recent SDK events and heartbeat quality for anomalies or gaps.",
  "deployment-review":
    "Assess deployment readiness and risks based on my current health signals.",
  "security-scan":
    "Run a security review covering API exposure, key leakage, rate limiting, authentication, missing headers and potential vulnerabilities.",
  "review-architecture":
    "Review my project architecture and suggest improvements to structure, folder organization, maintainability and scalability.",
  "database-review":
    "Review likely database concerns — latency, query patterns and indexing — based on the available signals.",
};

const PROMPT_BODIES_TR: Record<string, string> = {
  "analyze-project":
    "Projemin genel sağlığını analiz et ve kanıta dayalı, önceliklendirilmiş bir aksiyon planı ver.",
  "analyze-error":
    "En sık görülen son hatamı analiz et: olası kök neden, dayandığın kanıtlar, önerilen kontroller ve düzeltmeler, güven düzeyin.",
  "analyze-incident":
    "En son olayımı analiz et — olası neden, katkıda bulunan faktörler ve kurtarma adımları.",
  "performance-audit":
    "Performans metriklerimi (page load, LCP, CLS, INP, TTFB) incele ve trade-off'larıyla birlikte iyileştirme öner.",
  "analyze-api":
    "API kullanımımı ve hata kalıplarımı güvenilirlik, gecikme ve rate-limit açısından incele.",
  "analyze-logs":
    "Son hata ve olay kalıplarımı analiz et; olağandışı veya yükselen sinyalleri vurgula.",
  "analyze-stack-trace":
    "Bir stack trace yapıştıracağım. Olası kök nedeni ve sorumlu olabilecek dosyaları bulmama yardım et:\n\n```\n\n```",
  "analyze-sdk-events":
    "Son SDK olaylarımı ve heartbeat kalitesini anomaliler veya boşluklar açısından analiz et.",
  "deployment-review":
    "Mevcut sağlık sinyallerine göre deployment hazırlığını ve riskleri değerlendir.",
  "security-scan":
    "API açığı, key sızıntısı, rate limiting, kimlik doğrulama, eksik header'lar ve olası zafiyetleri kapsayan bir güvenlik incelemesi yap.",
  "review-architecture":
    "Proje mimarimi incele; yapı, klasör düzeni, sürdürülebilirlik ve ölçeklenebilirlik için iyileştirmeler öner.",
  "database-review":
    "Mevcut sinyallere göre olası veritabanı sorunlarını — gecikme, sorgu kalıpları ve indeksleme — incele.",
};

function promptBodiesFor(locale: Locale): Record<string, string> {
  return locale === "tr" ? PROMPT_BODIES_TR : PROMPT_BODIES_EN;
}

const PROMPT_LABELS_EN: Record<string, string> = {
  "analyze-project": "Analyze Project",
  "analyze-error": "Analyze Error",
  "analyze-incident": "Analyze Incident",
  "performance-audit": "Analyze Performance",
  "analyze-api": "Analyze API",
  "analyze-logs": "Analyze Logs",
  "analyze-stack-trace": "Analyze Stack Trace",
  "analyze-sdk-events": "Analyze SDK Events",
  "deployment-review": "Deployment Review",
  "security-scan": "Security Scan",
  "review-architecture": "Architecture Review",
  "database-review": "Database Review",
};

/** Suggested chips for the empty chat state, localized to the UI locale. */
export function suggestedAnalyses(locale: Locale = "en"): SuggestedAnalysis[] {
  const bodies = promptBodiesFor(locale);
  return Object.keys(bodies).map((intent) => ({
    intent,
    label: PROMPT_LABELS_EN[intent] ?? intent,
    prompt: bodies[intent]!,
  }));
}

/** @deprecated Prefer `suggestedAnalyses(locale)`. */
export const SUGGESTED_ANALYSES: SuggestedAnalysis[] = suggestedAnalyses("en");

export const INTENT_PROMPTS: Record<string, string> = PROMPT_BODIES_EN;

/** Resolves a deep-link intent to its starter prompt, if known. */
export function promptForIntent(
  intent: string | undefined,
  locale: Locale = "en",
): string | null {
  if (!intent) return null;
  return promptBodiesFor(locale)[intent] ?? null;
}

/** Localized chip / card label for a known intent; falls back to English. */
export function promptLabelForIntent(
  intent: string,
  prompts: AiPromptLabels,
  fallback?: string,
): string {
  const key = INTENT_LABEL_KEYS[intent];
  if (key) return prompts[key];
  return fallback ?? intent;
}

/** Builds a locale-aware “analyze this error” deep-link prompt body. */
export function buildAnalyzeErrorDeepLinkPrompt(
  input: {
    id: string;
    message: string;
    type?: string | null;
    level: string;
    fingerprint: string;
    occurrences: number;
    environment: string;
    release?: string | null;
    url?: string | null;
    stack?: string | null;
  },
  locale: Locale = "en",
): string {
  const intro =
    locale === "tr"
      ? "Bu hatayı kök neden, öneriler, güven düzeyi ve ilgili sinyallerle analiz et."
      : "Analyze this error with root cause, recommendations, confidence, and related signals.";

  return [
    intro,
    "",
    `Error ID: ${input.id}`,
    `Message: ${input.message}`,
    `Type: ${input.type ?? "n/a"}`,
    `Level: ${input.level}`,
    `Fingerprint: ${input.fingerprint}`,
    `Occurrences: ${input.occurrences}`,
    `Environment: ${input.environment}`,
    `Release: ${input.release ?? "n/a"}`,
    `URL: ${input.url ?? "n/a"}`,
    input.stack ? `\nStack:\n${input.stack.slice(0, 3500)}` : "",
  ].join("\n");
}
