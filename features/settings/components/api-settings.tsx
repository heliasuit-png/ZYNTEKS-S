"use client";

import Link from "next/link";
import { Webhook } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelDescription,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import { Badge } from "@/components/dashboard/badge";
import { CopyButton } from "@/components/dashboard/copy-button";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import type { PlanLimits } from "@/lib/constants";

export function ApiSettingsPanel({
  activeKeyCount,
  totalKeyCount,
  plan,
  limits,
  webhookHint,
}: {
  activeKeyCount: number;
  totalKeyCount: number;
  plan: string;
  limits: PlanLimits;
  webhookHint: string;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.settings.api;

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label={t.activeKeys} value={String(activeKeyCount)} />
          <Stat label={t.totalKeys} value={String(totalKeyCount)} />
          <Stat
            label={t.keysPerProject}
            value={String(limits.apiKeysPerProject)}
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.04}>
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{t.keysTitle}</PanelTitle>
              <PanelDescription>{t.keysDesc}</PanelDescription>
            </div>
            <Badge tone="primary">{plan}</Badge>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <Link
              href={DASHBOARD_ROUTES.apiKeys}
              className="inline-flex rounded-lg bg-zt-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
            >
              {t.manageApiKeys}
            </Link>
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.08}>
        <Panel>
          <PanelHeader>
            <PanelTitle>{t.webhooks}</PanelTitle>
            <PanelDescription>{t.webhooksDesc}</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <p className="flex items-start gap-2 text-sm text-zt-muted">
              <Webhook className="mt-0.5 size-4 shrink-0 text-zt-primary" aria-hidden />
              {webhookHint}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={DASHBOARD_ROUTES.notifications}
                className="rounded-lg border border-zt-border px-3 py-2 text-sm text-zt-muted transition-colors hover:text-zt-text"
              >
                {t.notificationWebhooks}
              </Link>
              <CopyButton value={webhookHint} label={t.copySummary} />
            </div>
          </PanelContent>
        </Panel>
      </FadeIn>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zt-border bg-zt-surface p-4">
      <p className="text-xs text-zt-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zt-text">{value}</p>
    </div>
  );
}
