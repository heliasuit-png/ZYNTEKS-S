"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  History,
  KeyRound,
  Laptop,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";

import { Badge } from "@/components/dashboard/badge";
import { Button } from "@/components/dashboard/button";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelDescription,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import { formatDate, formatRelativeTime } from "@/utils/format";
import {
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "@/features/workspace/actions";
import type { UserSession } from "@/services/workspace/sessions.service";

export function SecurityView({
  sessions,
  recentLogins,
  apiKeyCount,
  twoFactorPolicyEnabled,
  passwordChangedAt,
}: {
  sessions: UserSession[];
  recentLogins: UserSession[];
  apiKeyCount: number;
  twoFactorPolicyEnabled: boolean;
  passwordChangedAt: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={ShieldCheck}
            label="Workspace 2FA policy"
            value={twoFactorPolicyEnabled ? "Required" : "Optional"}
            tone={twoFactorPolicyEnabled ? "success" : "warning"}
          />
          <StatCard
            icon={MonitorSmartphone}
            label="Active devices"
            value={String(sessions.length)}
            tone="primary"
          />
          <StatCard
            icon={KeyRound}
            label="API keys"
            value={String(apiKeyCount)}
            tone="default"
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.04}>
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Two-factor authentication</PanelTitle>
              <PanelDescription>
                Personal MFA enrollment is prepared for a future release. Workspace
                policy can already require 2FA when your identity provider supports
                it.
              </PanelDescription>
            </div>
            <Badge tone="default">Coming soon</Badge>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-zt-border bg-white/[0.015] p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zt-primary/15 text-zt-primary">
                <ShieldQuestion className="size-5" aria-hidden />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zt-text">
                  Authenticator app enrollment
                </p>
                <p className="text-sm text-zt-muted">
                  TOTP setup, recovery codes and challenge prompts will appear here.
                  Until then, enforce the workspace policy from Organization settings.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="button" size="sm" disabled aria-disabled>
                    Enable 2FA (soon)
                  </Button>
                  <Link
                    href={DASHBOARD_ROUTES.organization}
                    className="inline-flex items-center rounded-lg border border-zt-border px-3 py-1.5 text-sm text-zt-muted transition-colors hover:text-zt-text"
                  >
                    Manage 2FA policy
                  </Link>
                </div>
              </div>
            </div>
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.08}>
        <Panel>
          <PanelHeader className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <PanelTitle>Active sessions &amp; devices</PanelTitle>
              <PanelDescription>
                Current session, browsers, operating systems and last activity.
              </PanelDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  void revokeOtherSessionsAction();
                })
              }
            >
              <LogOut className="size-4" aria-hidden />
              Log out all other devices
            </Button>
          </PanelHeader>
          <PanelContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-zt-muted">
                No tracked sessions yet. Browse the dashboard to register this device.
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col gap-3 rounded-xl border border-zt-border bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-zt-primary/15 text-zt-primary">
                      <Laptop className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zt-text">
                        {session.device_label ?? "Unknown device"}
                        {session.is_current ? (
                          <Badge tone="success" className="ml-2">
                            Current
                          </Badge>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-zt-muted">
                        {session.browser ?? "Browser"} · {session.os ?? "OS"} ·{" "}
                        {session.country ?? "Unknown country"}
                      </p>
                      <p className="mt-0.5 text-xs text-zt-muted">
                        Last activity {formatRelativeTime(session.last_active_at)}
                        {session.ip_address ? ` · ${session.ip_address}` : ""}
                      </p>
                    </div>
                  </div>
                  {!session.is_current ? (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        startTransition(() => {
                          void revokeSessionAction(session.id);
                        })
                      }
                    >
                      Revoke
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.12}>
        <Panel>
          <PanelHeader>
            <PanelTitle>Recent logins</PanelTitle>
            <PanelDescription>
              Latest authentication activity across your devices.
            </PanelDescription>
          </PanelHeader>
          <PanelContent>
            <ul className="space-y-2">
              {recentLogins.map((login) => (
                <li
                  key={login.id}
                  className="flex items-center justify-between rounded-lg border border-zt-border/60 px-3 py-2 text-sm"
                >
                  <span className="text-zt-text">
                    {login.device_label ?? "Device"} · {login.country ?? "—"}
                  </span>
                  <span className="text-xs text-zt-muted">
                    {formatRelativeTime(login.created_at)}
                  </span>
                </li>
              ))}
              {recentLogins.length === 0 ? (
                <li className="text-sm text-zt-muted">No login history yet.</li>
              ) : null}
            </ul>
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.16}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader>
              <PanelTitle>Password history</PanelTitle>
              <PanelDescription>
                Last password change recorded for this account.
              </PanelDescription>
            </PanelHeader>
            <PanelContent className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-zt-primary/15 text-zt-primary">
                  <History className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm text-zt-text">
                    {passwordChangedAt
                      ? `Changed ${formatRelativeTime(passwordChangedAt)}`
                      : "No password change recorded yet"}
                  </p>
                  <p className="mt-1 text-xs text-zt-muted">
                    {passwordChangedAt
                      ? formatDate(passwordChangedAt)
                      : "Update your password from Profile settings."}
                  </p>
                </div>
              </div>
              <Link
                href={DASHBOARD_ROUTES.profile}
                className="inline-flex rounded-lg border border-zt-border px-3 py-2 text-sm text-zt-muted transition-colors hover:text-zt-text"
              >
                Change password
              </Link>
            </PanelContent>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>API keys</PanelTitle>
              <PanelDescription>
                Project API and SDK keys for this account.
              </PanelDescription>
            </PanelHeader>
            <PanelContent className="space-y-3">
              <p className="text-sm text-zt-muted">
                {apiKeyCount === 0
                  ? "No API keys yet."
                  : `${apiKeyCount} key${apiKeyCount === 1 ? "" : "s"} associated with workspace projects.`}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={DASHBOARD_ROUTES.apiKeys}
                  className="inline-flex rounded-lg bg-zt-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
                >
                  Manage API keys
                </Link>
                <Link
                  href={DASHBOARD_ROUTES.settingsApi}
                  className="inline-flex rounded-lg border border-zt-border px-3 py-2 text-sm text-zt-muted transition-colors hover:text-zt-text"
                >
                  API settings
                </Link>
              </div>
            </PanelContent>
          </Panel>
        </div>
      </FadeIn>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  tone: "success" | "warning" | "primary" | "default";
}) {
  return (
    <div className="zt-card rounded-2xl border border-zt-border p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/[0.04] text-zt-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-xs text-zt-muted">{label}</p>
          <Badge tone={tone} className="mt-1">
            {value}
          </Badge>
        </div>
      </div>
    </div>
  );
}
