"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bug,
  CheckCircle2,
  ExternalLink,
  FolderKanban,
  KeyRound,
  PartyPopper,
  Radio,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AiOrb } from "@/components/dashboard/home/ai-orb";
import { SdkInstaller } from "@/components/dashboard/sdk/sdk-installer";
import { Button } from "@/components/dashboard/button";
import { DASHBOARD_ROUTES } from "@/lib/constants";

const STORAGE_KEY = "zt:onboarding:done";
const STEP_LABELS = ["Welcome", "Project", "API Key", "Install SDK", "Heartbeat"];
const TOTAL = STEP_LABELS.length;

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 420,
        y: -(120 + Math.random() * 240),
        rotate: Math.random() * 360,
        delay: Math.random() * 0.2,
        color: ["#4f8cff", "#7c5cff", "#2ce6d1", "#22c55e", "#f59e0b"][i % 5],
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute size-2 rounded-sm"
          style={{ backgroundColor: p.color }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate }}
          transition={{ duration: 1.4, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

interface StepDef {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: { label: string; href: string };
}

export function Onboarding() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable — skip onboarding silently.
    }
  }, []);

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // best-effort persistence only
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, finish]);

  if (!mounted) return null;

  const steps: StepDef[] = [
    {
      icon: PartyPopper,
      title: "Welcome to ZYNTEKSIS",
      description:
        "Let's monitor your first application. In a few quick steps you'll be capturing errors, heartbeats and performance in real time.",
    },
    {
      icon: FolderKanban,
      title: "Create your first project",
      description:
        "A project groups everything we monitor for one application — errors, incidents, health and API keys.",
      cta: { label: "Open Projects", href: DASHBOARD_ROUTES.projects },
    },
    {
      icon: KeyRound,
      title: "Generate an API key",
      description:
        "Your API key authenticates the SDK. Create one for the environment you want to monitor — you'll copy it into the snippet next.",
      cta: { label: "Open API Keys", href: DASHBOARD_ROUTES.apiKeys },
    },
    {
      icon: Bug,
      title: "Install the SDK",
      description:
        "Pick your framework and drop in the snippet. It automatically captures errors, promise rejections and performance.",
    },
    {
      icon: Radio,
      title: "Verify your first heartbeat",
      description:
        "Once the SDK is running, your app sends a heartbeat every 60 seconds. Open Health Monitor to watch it arrive.",
      cta: { label: "Open Health Monitor", href: DASHBOARD_ROUTES.health },
    },
  ];

  const done = step >= TOTAL;
  const current = steps[Math.min(step, TOTAL - 1)]!;
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[65] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Onboarding"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="zt-glass-strong relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-zt-border shadow-2xl shadow-black/60"
          >
            {/* Progress + skip */}
            <div className="flex items-center justify-between gap-4 px-6 pt-5">
              <div className="flex flex-1 items-center gap-1.5">
                {STEP_LABELS.map((label, index) => (
                  <div
                    key={label}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      index < step || done
                        ? "bg-gradient-to-r from-zt-primary to-zt-secondary"
                        : "bg-white/10",
                    )}
                  />
                ))}
              </div>
              {!done ? (
                <button
                  type="button"
                  onClick={finish}
                  className="flex items-center gap-1 text-xs text-zt-muted transition-colors hover:text-zt-text"
                >
                  Skip
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {done ? (
                <div className="relative flex flex-col items-center py-6 text-center">
                  <Confetti />
                  <div className="relative mb-4">
                    <AiOrb className="size-32" interactive={false} />
                  </div>
                  <h2 className="text-2xl font-semibold text-zt-text">
                    You&apos;re all set! 🎉
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-zt-muted">
                    Your workspace is ready. Head to the dashboard to watch your
                    application&apos;s health in real time.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center">
                    {step === 0 ? (
                      <div className="mb-4">
                        <AiOrb className="size-32" />
                      </div>
                    ) : (
                      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-zt-primary/20 to-zt-secondary/10 text-zt-primary">
                        <Icon className="size-7" aria-hidden />
                      </span>
                    )}
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-zt-muted">
                      Step {step + 1} of {TOTAL}
                    </span>
                    <h2 className="mt-1 text-xl font-semibold text-zt-text">
                      {current.title}
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-zt-muted">
                      {current.description}
                    </p>

                    {current.cta ? (
                      <Button asChild variant="secondary" size="sm" className="mt-4">
                        <Link
                          href={current.cta.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {current.cta.label}
                          <ExternalLink aria-hidden />
                        </Link>
                      </Button>
                    ) : null}
                  </div>

                  {step === 3 ? (
                    <div className="mt-5">
                      <SdkInstaller />
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Footer navigation */}
            <div className="flex items-center justify-between gap-3 border-t border-zt-border px-6 py-4">
              {done ? (
                <>
                  <span className="flex items-center gap-1.5 text-xs text-zt-success">
                    <CheckCircle2 className="size-4" aria-hidden />
                    Setup complete
                  </span>
                  <Button onClick={finish} size="md">
                    Go to dashboard
                    <ArrowRight aria-hidden />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className={cn(step === 0 && "invisible")}
                  >
                    <ArrowLeft aria-hidden />
                    Back
                  </Button>
                  <Button onClick={() => setStep((s) => s + 1)} size="md">
                    {step === 0
                      ? "Get started"
                      : step === TOTAL - 1
                        ? "Finish setup"
                        : "Next"}
                    <ArrowRight aria-hidden />
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
