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
  Gauge,
  KeyRound,
  PartyPopper,
  Radio,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AiOrb } from "@/components/dashboard/home/ai-orb";
import { SdkInstaller } from "@/components/dashboard/sdk/sdk-installer";
import { Button } from "@/components/dashboard/button";
import { useDictionary } from "@/components/i18n/locale-provider";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { SUGGESTED_ANALYSES, promptLabelForIntent } from "@/features/ai/prompts";

const STORAGE_KEY = "zt:onboarding:done";
const TOTAL = 6;

const FIRST_PROMPTS = SUGGESTED_ANALYSES.slice(0, 3);

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        // Deterministic positions — avoids Math.random hydration noise if ever SSR'd.
        x: ((i * 37) % 420) - 210,
        y: -((i * 29) % 240) - 120,
        rotate: (i * 48) % 360,
        delay: (i % 5) * 0.04,
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
  const { dict } = useDictionary();
  const o = dict.dash.onboarding;
  const common = dict.dashboardCommon;
  const qa = dict.dash.home.quickActions;

  const stepLabels = [
    o.tabs.welcome,
    o.tabs.tryAi,
    o.tabs.firstPrompt,
    o.tabs.credits,
    o.tabs.apiSdk,
    o.tabs.heartbeat,
  ] as const;

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
      title: o.welcome,
      description: o.welcomeDesc,
    },
    {
      icon: Sparkles,
      title: o.tryAi,
      description: o.tryAiDesc,
      cta: { label: qa.openAiAssistant, href: DASHBOARD_ROUTES.aiAssistant },
    },
    {
      icon: Sparkles,
      title: o.firstPrompt,
      description: o.firstPromptDesc,
    },
    {
      icon: Gauge,
      title: o.credits,
      description: o.creditsDesc,
      cta: { label: o.viewAiUsage, href: DASHBOARD_ROUTES.aiAssistant },
    },
    {
      icon: KeyRound,
      title: o.connectApp,
      description: o.connectAppDesc,
      cta: { label: o.openApiKeys, href: DASHBOARD_ROUTES.apiKeys },
    },
    {
      icon: Radio,
      title: o.heartbeat,
      description: o.heartbeatDesc,
      cta: { label: o.openHealth, href: DASHBOARD_ROUTES.health },
    },
  ];

  const done = step >= TOTAL;
  const current = steps[Math.min(step, TOTAL - 1)]!;
  const Icon = current.icon;
  // Step index 4 shows SdkInstaller (API / SDK).
  const showSdk = step === 4;
  const showFirstPrompts = step === 2;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-4"
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
            aria-label={o.ariaLabel}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="zt-glass-strong relative flex max-h-[min(88vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-zt-border shadow-2xl shadow-black/60"
          >
            <div className="flex items-center justify-between gap-4 px-4 pt-5 sm:px-6">
              <div className="flex flex-1 items-center gap-1.5">
                {stepLabels.map((label, index) => (
                  <div
                    key={label}
                    title={label}
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
                  className="flex shrink-0 items-center gap-1 text-xs text-zt-muted transition-colors hover:text-zt-text"
                >
                  {o.skip}
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              {done ? (
                <div className="relative flex flex-col items-center py-6 text-center">
                  <Confetti />
                  <div className="relative mb-4">
                    <AiOrb className="size-28 sm:size-32" interactive={false} />
                  </div>
                  <h2 className="text-2xl font-semibold text-zt-text">
                    {o.readyTitle}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-zt-muted">
                    {o.readyDesc}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center">
                    {step === 0 || step === 1 ? (
                      <div className="mb-4">
                        <AiOrb className="size-28 sm:size-32" />
                      </div>
                    ) : (
                      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-zt-primary/20 to-zt-secondary/10 text-zt-primary">
                        <Icon className="size-7" aria-hidden />
                      </span>
                    )}
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-zt-muted">
                      {fillTemplate(o.stepOf, {
                        current: step + 1,
                        total: TOTAL,
                      })}
                    </span>
                    <h2 className="mt-1 text-xl font-semibold text-zt-text">
                      {current.title}
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-zt-muted">
                      {current.description}
                    </p>

                    {current.cta ? (
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="mt-4"
                      >
                        <Link href={current.cta.href}>
                          {current.cta.label}
                          <ExternalLink aria-hidden />
                        </Link>
                      </Button>
                    ) : null}
                  </div>

                  {showFirstPrompts ? (
                    <ul className="mt-5 space-y-2">
                      {FIRST_PROMPTS.map((s) => (
                        <li key={s.intent}>
                          <Link
                            href={`${DASHBOARD_ROUTES.aiAssistant}?intent=${encodeURIComponent(s.intent)}`}
                            className="block rounded-xl border border-zt-border bg-zt-surface-2/60 px-3 py-2.5 text-left text-sm text-zt-text transition-colors hover:border-zt-border-strong hover:bg-zt-surface-2"
                          >
                            <span className="font-medium">
                              {promptLabelForIntent(
                                s.intent,
                                dict.dash.ai.prompts,
                                s.label,
                              )}
                            </span>
                            <span className="mt-0.5 block text-xs text-zt-muted line-clamp-2">
                              {s.prompt}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {showSdk ? (
                    <div className="mt-5">
                      <div className="mb-3 flex items-center gap-2 text-xs text-zt-muted">
                        <Bug className="size-3.5" aria-hidden />
                        {o.installSnippet}
                      </div>
                      <SdkInstaller />
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-zt-border px-4 py-4 sm:px-6">
              {done ? (
                <>
                  <span className="flex items-center gap-1.5 text-xs text-zt-success">
                    <CheckCircle2 className="size-4" aria-hidden />
                    {o.setupComplete}
                  </span>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild variant="secondary" size="md">
                      <Link href={DASHBOARD_ROUTES.aiAssistant}>
                        {o.openAi}
                        <Sparkles aria-hidden />
                      </Link>
                    </Button>
                    <Button onClick={finish} size="md">
                      {o.goToDashboard}
                      <ArrowRight aria-hidden />
                    </Button>
                  </div>
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
                    {common.back}
                  </Button>
                  <Button onClick={() => setStep((s) => s + 1)} size="md">
                    {step === 0
                      ? o.getStarted
                      : step === TOTAL - 1
                        ? o.finish
                        : common.next}
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
