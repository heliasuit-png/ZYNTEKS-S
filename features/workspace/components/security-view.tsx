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

import { useDictionary } from "@/components/i18n/locale-provider";
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
  const { dict, locale } = useDictionary();
  const t = dict.dash.security;
  const profile = dict.dash.settings.profile;
  const api = dict.dash.settings.api;
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={ShieldCheck}
            label={t.twoFactorPolicy}
            value={twoFactorPolicyEnabled ? t.required : t.optional}
            tone={twoFactorPolicyEnabled ? "success" : "warning"}
          />
          <StatCard
            icon={MonitorSmartphone}
            label={t.devices}
            value={String(sessions.length)}
            tone="primary"
          />
          <StatCard
            icon={KeyRound}
            label={t.apiKeysStat}
            value={String(apiKeyCount)}
            tone="default"
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.04}>
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{t.twoFactor}</PanelTitle>
              <PanelDescription>{t.mfaEnrollmentDesc}</PanelDescription>
            </div>
            <Badge tone="default">{t.twoFactorUnavailable}</Badge>
          </PanelHeader>
          <PanelContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-zt-border bg-white/[0.015] p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zt-primary/15 text-zt-primary">
                <ShieldQuestion className="size-5" aria-hidden />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zt-text">
                  {t.mfaEnrollmentTitle}
                </p>
                <p className="mt-1 text-sm text-zt-muted">{t.mfaEnrollmentDesc}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    href={DASHBOARD_ROUTES.organization}
                    className="inline-flex items-center rounded-lg border border-zt-border px-3 py-1.5 text-sm text-zt-muted transition-colors hover:text-zt-text"
                  >
                    {t.manageMfaPolicy}
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
              <PanelTitle>{t.sessions}</PanelTitle>
              <PanelDescription>{t.sessionsDesc}</PanelDescription>
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
              {t.forceLogoutAll}
            </Button>
          </PanelHeader>
          <PanelContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-zt-muted">
                {t.noSessions}. {t.noSessionsDesc}
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
                        {session.device_label ?? t.unknownDevice}
                        {session.is_current ? (
                          <Badge tone="success" className="ml-2">
                            {t.currentSession}
                          </Badge>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-zt-muted">
                        {session.browser ?? t.browser} · {session.os ?? t.os} ·{" "}
                        {session.country ?? t.unknownCountry}
                      </p>
                      <p className="mt-0.5 text-xs text-zt-muted">
                        {t.lastActivity}{" "}
                        {formatRelativeTime(session.last_active_at, undefined, locale)}
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
                      {t.revokeSession}
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
            <PanelTitle>{t.recentLogins}</PanelTitle>
            <PanelDescription>{t.recentLoginsDesc}</PanelDescription>
          </PanelHeader>
          <PanelContent>
            <ul className="space-y-2">
              {recentLogins.map((login) => (
                <li
                  key={login.id}
                  className="flex items-center justify-between rounded-lg border border-zt-border/60 px-3 py-2 text-sm"
                >
                  <span className="text-zt-text">
                    {login.device_label ?? t.device} · {login.country ?? "—"}
                  </span>
                  <span className="text-xs text-zt-muted">
                    {formatRelativeTime(login.created_at, undefined, locale)}
                  </span>
                </li>
              ))}
              {recentLogins.length === 0 ? (
                <li className="text-sm text-zt-muted">{t.noLoginHistory}</li>
              ) : null}
            </ul>
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.16}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader>
              <PanelTitle>{t.passwordHistoryTitle}</PanelTitle>
              <PanelDescription>{t.passwordHistoryDesc}</PanelDescription>
            </PanelHeader>
            <PanelContent className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-zt-primary/15 text-zt-primary">
                  <History className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm text-zt-text">
                    {passwordChangedAt
                      ? formatRelativeTime(passwordChangedAt, undefined, locale)
                      : t.noPasswordHistory}
                  </p>
                  <p className="mt-1 text-xs text-zt-muted">
                    {passwordChangedAt
                      ? formatDate(passwordChangedAt)
                      : profile.changePassword}
                  </p>
                </div>
              </div>
              <Link
                href={DASHBOARD_ROUTES.profile}
                className="inline-flex rounded-lg border border-zt-border px-3 py-2 text-sm text-zt-muted transition-colors hover:text-zt-text"
              >
                {profile.changePassword}
              </Link>
            </PanelContent>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>{t.apiKeysTitle}</PanelTitle>
              <PanelDescription>{t.apiKeysDesc}</PanelDescription>
            </PanelHeader>
            <PanelContent className="space-y-3">
              <p className="text-sm text-zt-muted">
                {apiKeyCount === 0
                  ? dict.dash.apiKeys.noKeys
                  : `${apiKeyCount}`}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={DASHBOARD_ROUTES.apiKeys}
                  className="inline-flex rounded-lg bg-zt-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90"
                >
                  {api.manageApiKeys}
                </Link>
                <Link
                  href={DASHBOARD_ROUTES.settingsApi}
                  className="inline-flex rounded-lg border border-zt-border px-3 py-2 text-sm text-zt-muted transition-colors hover:text-zt-text"
                >
                  {api.keysTitle}
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
