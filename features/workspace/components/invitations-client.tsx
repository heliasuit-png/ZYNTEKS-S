"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/dashboard/button";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import {
  acceptInvitationAction,
  declineInvitationAction,
} from "@/features/workspace/actions";
import { cn } from "@/lib/utils";

interface InvitationRow {
  id: string;
  token: string;
  email: string;
  roleLabel: string;
  workspaceName: string;
  expiresLabel: string;
}

export function InvitationsClient({
  invitations,
  highlightToken,
}: {
  invitations: InvitationRow[];
  highlightToken?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <FadeIn>
      <Panel>
        <PanelHeader>
          <PanelTitle>Pending invitations</PanelTitle>
        </PanelHeader>
        <PanelContent className="space-y-3">
          {invitations.length === 0 ? (
            <p className="text-sm text-zt-muted">
              You have no pending workspace invitations.
            </p>
          ) : (
            invitations.map((inv) => (
              <div
                key={inv.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border border-zt-border bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between",
                  highlightToken === inv.token && "border-zt-primary/50",
                )}
              >
                <div>
                  <p className="text-sm font-medium text-zt-text">
                    {inv.workspaceName}
                  </p>
                  <p className="text-xs text-zt-muted">
                    Role: {inv.roleLabel} · expires {inv.expiresLabel}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      startTransition(() => {
                        void acceptInvitationAction(inv.token);
                      })
                    }
                  >
                    <Check className="size-4" aria-hidden />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      startTransition(() => {
                        void declineInvitationAction(inv.token);
                      })
                    }
                  >
                    <X className="size-4" aria-hidden />
                    Decline
                  </Button>
                </div>
              </div>
            ))
          )}
        </PanelContent>
      </Panel>
    </FadeIn>
  );
}
