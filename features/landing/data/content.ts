export const LANDING_COPY = {
  brand: "ZYNTEKSIS",
  headline: "Observe. Analyze. Ship with confidence.",
  subheadline:
    "Production monitoring, AI analysis, and status pages in one platform — built for teams that ship software every day.",
  primaryCta: "Start free",
  secondaryCta: "See how it works",
} as const;

export const FEATURES = [
  {
    id: "monitoring",
    title: "Monitoring",
    description:
      "Capture errors, performance signals, and release health across every project environment.",
    icon: "Activity",
  },
  {
    id: "ai",
    title: "AI Analysis",
    description:
      "Ask the assistant about incidents, stack traces, and trends without leaving your workspace.",
    icon: "Sparkles",
  },
  {
    id: "projects",
    title: "Projects",
    description:
      "Organize services by project, environment, and ownership with workspace-level control.",
    icon: "Folders",
  },
  {
    id: "api-keys",
    title: "API Keys",
    description:
      "Issue scoped SDK keys, rotate secrets, and revoke access instantly from one place.",
    icon: "KeyRound",
  },
  {
    id: "health",
    title: "Health Monitoring",
    description:
      "Track uptime, latency, and endpoint checks with clear timelines for every service.",
    icon: "HeartPulse",
  },
  {
    id: "notifications",
    title: "Notifications",
    description:
      "Route alerts to email, dashboard, Slack, and Discord with per-category preferences.",
    icon: "Bell",
  },
  {
    id: "status",
    title: "Status Pages",
    description:
      "Publish branded public status pages so customers always know what is happening.",
    icon: "Globe2",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Create Project",
    description:
      "Spin up a project for each service, set the environment, and invite your team.",
  },
  {
    step: 2,
    title: "Generate API Key",
    description:
      "Create a scoped key for production or staging — copy once, rotate anytime.",
  },
  {
    step: 3,
    title: "Install SDK",
    description:
      "Drop the SDK into your app and start streaming errors, heartbeats, and performance data.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: "What is ZYNTEKSIS?",
    a: "ZYNTEKSIS is a production-ready SaaS platform for error monitoring, health checks, AI-assisted analysis, notifications, and public status pages — delivered as complete source code.",
  },
  {
    q: "Do I need a payment provider to use billing UI?",
    a: "No. Plan limits and the billing interface ship ready. Checkout, portals, and invoices activate when you connect a PaymentProvider implementation — no vendor is bundled.",
  },
  {
    q: "Which frameworks does the SDK support?",
    a: "Install via npm, pnpm, or yarn. The SDK surface targets modern JavaScript/TypeScript apps, with framework-specific setup guidance in the product.",
  },
  {
    q: "Can I self-host?",
    a: "Yes. The repository is designed to run against Supabase and your own environment variables, so you control hosting, data, and integrations.",
  },
  {
    q: "Is there an AI assistant?",
    a: "Yes. Workspace members can chat with an AI assistant that uses project context for incidents, errors, and operational questions, with plan-based usage limits.",
  },
  {
    q: "How do status pages work?",
    a: "Create a public status page, attach components and incidents, and share a branded URL with customers. Uptime windows and incident history are included.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "One workspace for errors, health, incidents, and public status — without stitching five tools together.",
    name: "Operations",
    role: "Built for on-call teams",
    company: "ZYNTEKSIS",
  },
  {
    quote:
      "Scoped API keys, SDK ingest, and AI analysis on the same project context keep debugging grounded in real telemetry.",
    name: "Engineering",
    role: "Built for product teams",
    company: "ZYNTEKSIS",
  },
  {
    quote:
      "Ship the complete source, connect your own payment provider when ready, and keep ownership of data and infrastructure.",
    name: "Platform owners",
    role: "Built for source buyers",
    company: "ZYNTEKSIS",
  },
] as const;

export const SDK_FRAMEWORKS = [
  {
    id: "javascript",
    label: "JavaScript",
    snippet: `import { Zynteksis } from "@zynteksis/sdk";

const zyn = new Zynteksis({
  apiKey: "ZYN-KEY-...",
  environment: "production",
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
      endpoint: "https://your-zynteksis-host.com",
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
}).init();

// Optional: wrap the tree with the SDK error boundary export.`,
  },
  {
    id: "vue",
    label: "Vue",
    snippet: `import { Zynteksis } from "@zynteksis/sdk";

new Zynteksis({
  apiKey: "ZYN-KEY-...",
  environment: "production",
}).init();`,
  },
] as const;

export const PACKAGE_MANAGERS = [
  { id: "npm", label: "npm", command: "npm install @zynteksis/sdk" },
  { id: "pnpm", label: "pnpm", command: "pnpm add @zynteksis/sdk" },
  { id: "yarn", label: "yarn", command: "yarn add @zynteksis/sdk" },
] as const;
