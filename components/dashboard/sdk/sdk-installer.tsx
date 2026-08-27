"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/dashboard/copy-button";
import { useDictionary } from "@/components/i18n/locale-provider";
import { ZYNTEKSIS_PRODUCTION_ENDPOINT } from "@/lib/constants";
import { fillTemplate } from "@/lib/i18n/fill-template";

interface Step {
  title: string;
  file?: string;
  code: string;
}

interface Framework {
  id: string;
  label: string;
  steps: Step[];
}

const INSTALL_PRIMARY = `# Build the commercial SDK package, then path-install:
#   cd sdk && npm install && npm run build
npm install /absolute/path/to/zynteksis/sdk`;

function config(release = "1.0.0"): string {
  return `{
  apiKey: "ZYN-KEY-XXXXXXXXXXXXXXXXXXXXXXXX",
  environment: "production",
  release: "${release}",
  endpoint: "${ZYNTEKSIS_PRODUCTION_ENDPOINT}",
}`;
}

export function SdkInstaller({
  onVerify,
  className,
}: {
  onVerify?: () => void;
  className?: string;
}) {
  const { dict } = useDictionary();
  const shell = dict.dash.shell;
  const steps = shell.sdkSteps;
  const [activeId, setActiveId] = useState("nextjs");

  const frameworks: Framework[] = [
    {
      id: "nextjs",
      label: "Next.js",
      steps: [
        { title: steps.installSdk, code: INSTALL_PRIMARY },
        {
          title: steps.createClientInitializer,
          file: "app/zynteksis-init.tsx",
          code: `"use client";

import { useEffect } from "react";
import { Zynteksis } from "@zynteksis/sdk";

export function ZynteksisInit() {
  useEffect(() => {
    new Zynteksis(${config()}).init();
  }, []);
  return null;
}`,
        },
        {
          title: steps.mountRootLayout,
          file: "app/layout.tsx",
          code: `import { ZynteksisInit } from "./zynteksis-init";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ZynteksisInit />
        {children}
      </body>
    </html>
  );
}`,
        },
      ],
    },
    {
      id: "react",
      label: "React",
      steps: [
        { title: steps.installSdk, code: INSTALL_PRIMARY },
        {
          title: steps.initBeforeRendering,
          file: "src/main.tsx",
          code: `import { Zynteksis } from "@zynteksis/sdk";

new Zynteksis(${config()}).init();`,
        },
      ],
    },
    {
      id: "vue",
      label: "Vue",
      steps: [
        { title: steps.installSdk, code: INSTALL_PRIMARY },
        {
          title: steps.initEntryFile,
          file: "src/main.ts",
          code: `import { Zynteksis } from "@zynteksis/sdk";

new Zynteksis(${config()}).init();`,
        },
      ],
    },
    {
      id: "angular",
      label: "Angular",
      steps: [
        { title: steps.installSdk, code: INSTALL_PRIMARY },
        {
          title: steps.initBeforeBootstrap,
          file: "src/main.ts",
          code: `import { Zynteksis } from "@zynteksis/sdk";

new Zynteksis(${config()}).init();`,
        },
      ],
    },
    {
      id: "laravel",
      label: "Laravel (Vite)",
      steps: [
        { title: steps.installSdkNpm, code: INSTALL_PRIMARY },
        {
          title: steps.initBrowserBundle,
          file: "resources/js/app.js",
          code: `import { Zynteksis } from "@zynteksis/sdk";

new Zynteksis(${config()}).init();`,
        },
        {
          title: steps.buildAssets,
          code: `npm run build`,
        },
      ],
    },
  ];

  const active = frameworks.find((f) => f.id === activeId) ?? frameworks[0]!;

  return (
    <div className={cn("space-y-4", className)}>
      <p className="rounded-xl border border-zt-warning/30 bg-zt-warning/10 px-3 py-2 text-xs text-zt-warning">
        {shell.sdkWarning}
      </p>

      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label={shell.frameworkTablist}
      >
        {frameworks.map((framework) => {
          const isActive = framework.id === activeId;
          return (
            <button
              key={framework.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(framework.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? "border-zt-primary/40 bg-gradient-to-r from-zt-primary/20 to-zt-secondary/10 text-zt-text"
                  : "border-zt-border bg-white/[0.02] text-zt-muted hover:border-zt-border-strong hover:text-zt-text",
              )}
            >
              {framework.label}
            </button>
          );
        })}
      </div>

      <ol className="space-y-3">
        {active.steps.map((step, index) => (
          <li
            key={`${active.id}-${index}`}
            className="rounded-xl border border-zt-border bg-white/[0.02] p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-zt-primary/15 text-[11px] font-semibold text-zt-primary">
                {index + 1}
              </span>
              <span className="text-sm font-medium text-zt-text">
                {step.title}
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-zt-border bg-black/40">
              <div className="flex items-center justify-between border-b border-zt-border px-3 py-1.5">
                <span className="font-mono text-[11px] text-zt-muted">
                  {step.file ?? shell.terminal}
                </span>
                <CopyButton
                  value={step.code}
                  className="border-0 bg-transparent px-1.5 py-0.5"
                />
              </div>
              <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed text-zt-text/90">
                <code>{step.code}</code>
              </pre>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-xs text-zt-muted">
        {fillTemplate(shell.sdkReplaceHint, {
          endpoint: ZYNTEKSIS_PRODUCTION_ENDPOINT,
        })}
      </p>

      {onVerify ? (
        <button
          type="button"
          onClick={onVerify}
          className="w-full rounded-xl border border-zt-border bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zt-text transition-colors hover:border-zt-primary/40 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zt-primary/50"
        >
          {shell.sdkContinue}
        </button>
      ) : null}
    </div>
  );
}
