"use client";

import { PlugZap } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/dashboard/badge";
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";

/**
 * Billing settings — documents the payment integration surface for buyers
 * of this SaaS source without exposing credentials or webhooks.
 */
export function BillingSettings({
  providerId,
  providerDisplayName,
  providerConfigured,
}: {
  providerId: string;
  providerDisplayName: string;
  providerConfigured: boolean;
}) {
  const { dict } = useDictionary();
  const t = dict.dash.billingUi;

  return (
    <FadeIn delay={0.06}>
      <Panel>
        <PanelHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PanelTitle>{t.billingSettings}</PanelTitle>
            <PanelDescription>{t.billingSettingsDesc}</PanelDescription>
          </div>
          <Badge tone={providerConfigured ? "success" : "warning"}>
            {providerConfigured ? t.configured : t.notConnected}
          </Badge>
        </PanelHeader>
        <PanelContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-zt-border bg-white/[0.02] p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zt-primary/15 text-zt-primary">
              <PlugZap className="size-5" aria-hidden />
            </span>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-zt-text">{providerDisplayName}</p>
              <p className="text-zt-muted">
                {t.providerId.replace("{id}", providerId)}
              </p>
            </div>
          </div>
        </PanelContent>
      </Panel>
    </FadeIn>
  );
}
