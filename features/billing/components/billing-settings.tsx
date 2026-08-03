import { PlugZap } from "lucide-react";

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
  return (
    <FadeIn delay={0.06}>
      <Panel>
        <PanelHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PanelTitle>Billing settings</PanelTitle>
            <PanelDescription>
              Payment provider connection status for this installation.
            </PanelDescription>
          </div>
          <Badge tone={providerConfigured ? "success" : "warning"}>
            {providerConfigured ? "Configured" : "Not connected"}
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
                Provider id: <code className="text-zt-text">{providerId}</code>
              </p>
              <p className="text-zt-muted">
                To enable Upgrade, Purchase, Manage Subscription and Change Plan,
                implement <code className="text-zt-text">PaymentProvider</code>{" "}
                under <code className="text-zt-text">services/billing/providers/</code>{" "}
                and register it in{" "}
                <code className="text-zt-text">services/billing/factory.ts</code>.
                Read secrets from environment variables only — never commit API keys.
              </p>
            </div>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-xs text-zt-muted">
            <li>No Stripe / Lemon Squeezy / Paddle SDK is bundled.</li>
            <li>No payment webhooks are registered in this source.</li>
            <li>Plan limits remain enforced locally via PLAN_LIMITS.</li>
          </ul>
        </PanelContent>
      </Panel>
    </FadeIn>
  );
}
