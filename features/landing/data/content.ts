/**
 * Structural landing data (icons, SDK snippets, install commands).
 * User-facing copy lives in lib/i18n/dictionaries — use useDictionary() / getDictionary().
 */
import type { Dictionary } from "@/lib/i18n/dictionaries";

export const FEATURE_DEFS = [
  { id: "monitoring", icon: "Activity" },
  { id: "ai", icon: "Sparkles" },
  { id: "projects", icon: "Folders" },
  { id: "api-keys", icon: "KeyRound" },
  { id: "health", icon: "HeartPulse" },
  { id: "notifications", icon: "Bell" },
  { id: "status", icon: "Globe2" },
] as const;

export type FeatureId = (typeof FEATURE_DEFS)[number]["id"];

export function getFeatures(dict: Dictionary) {
  return FEATURE_DEFS.map((feature) => ({
    id: feature.id,
    icon: feature.icon,
    title: dict.landing.features.items[feature.id].title,
    description: dict.landing.features.items[feature.id].description,
  }));
}

export function getHowItWorks(dict: Dictionary) {
  return dict.landing.howItWorks.steps.map((step, index) => ({
    step: index + 1,
    title: step.title,
    description: step.description,
  }));
}

export function getFaqItems(dict: Dictionary) {
  return dict.landing.faq.items;
}

export function getTestimonials(dict: Dictionary) {
  return dict.landing.testimonials.items;
}

export const SDK_FRAMEWORKS = [
  {
    id: "javascript",
    label: "JavaScript",
    snippet: `import { Zynteksis } from "@zynteksis/sdk";

const zyn = new Zynteksis({
  apiKey: "ZYN-KEY-...",
  environment: "production",
  endpoint: "https://zynteksisv.vercel.app",
});
zyn.init();`,
  },
  {
    id: "nextjs",
    label: "Next.js",
    snippet: `// app/providers.tsx (client component)
"use client";
import { useEffect } from "react";
import { Zynteksis } from "@zynteksis/sdk";

export function MonitoringProvider({ children }) {
  useEffect(() => {
    new Zynteksis({
      apiKey: "ZYN-KEY-XXXXXXXXXXXXXXXX",
      environment: "production",
      endpoint: "https://zynteksisv.vercel.app",
    }).init();
  }, []);
  return children;
}`,
  },
  {
    id: "react",
    label: "React",
    snippet: `import { Zynteksis } from "@zynteksis/sdk";

new Zynteksis({
  apiKey: "ZYN-KEY-...",
  environment: "production",
  endpoint: "https://zynteksisv.vercel.app",
}).init();

// Optional: wrap the tree with ErrorBoundary from @zynteksis/sdk/react.`,
  },
  {
    id: "browser",
    label: "Any browser app",
    snippet: `// Same browser init for Vue, Svelte, or plain HTML + bundler.
import { Zynteksis } from "@zynteksis/sdk";

new Zynteksis({
  apiKey: "ZYN-KEY-...",
  environment: "production",
  endpoint: "https://zynteksisv.vercel.app",
}).init();`,
  },
] as const;

export const PACKAGE_MANAGERS = [
  {
    id: "npm",
    label: "npm",
    command: "npm install /absolute/path/to/zynteksis/sdk",
  },
  {
    id: "pnpm",
    label: "pnpm",
    command: "pnpm add /absolute/path/to/zynteksis/sdk",
  },
  {
    id: "yarn",
    label: "yarn",
    command: "yarn add /absolute/path/to/zynteksis/sdk",
  },
] as const;
