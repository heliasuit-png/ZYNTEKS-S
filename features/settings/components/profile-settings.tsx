"use client";

import { useActionState } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/dashboard/badge";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
  PanelDescription,
} from "@/components/dashboard/panel";
import { FadeIn } from "@/components/dashboard/motion";
import { formatDate, formatRelativeTime } from "@/utils/format";
import {
  changeEmailAction,
  changePasswordAction,
  deleteAccountAction,
  resendVerificationAction,
  updateProfileAction,
  uploadAvatarAction,
  initialSettingsActionState,
} from "@/features/settings/actions";
import type { Profile } from "@/services/profile";

const inputClass =
  "w-full rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-text outline-none focus:border-zt-primary";
const buttonClass =
  "rounded-lg bg-zt-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90 disabled:opacity-60";
const ghostClass =
  "rounded-lg border border-zt-border px-3 py-2 text-sm text-zt-muted transition-colors hover:text-zt-text disabled:opacity-60";

export function ProfileSettings({
  profile,
  emailVerified,
}: {
  profile: Profile;
  emailVerified: boolean;
}) {
  const { dict, locale } = useDictionary();
  const t = dict.dash.settings.profile;
  const common = dict.dashboardCommon;

  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initialSettingsActionState,
  );
  const [avatarState, avatarAction, avatarPending] = useActionState(
    uploadAvatarAction,
    initialSettingsActionState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePasswordAction,
    initialSettingsActionState,
  );
  const [emailState, emailAction, emailPending] = useActionState(
    changeEmailAction,
    initialSettingsActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAccountAction,
    initialSettingsActionState,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    resendVerificationAction,
    initialSettingsActionState,
  );

  const initials = (profile.full_name || profile.email)
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <FadeIn>
        <Panel>
          <PanelContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={t.avatarAlt}
                className="size-16 rounded-2xl border border-zt-border object-cover"
              />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-2xl bg-zt-primary/20 text-lg font-semibold text-zt-primary">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-zt-text">
                {profile.full_name ?? "—"}
              </p>
              <p className="text-sm text-zt-muted">{profile.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="primary">{profile.role}</Badge>
                <Badge tone="success">{profile.subscription_plan}</Badge>
                <Badge tone={emailVerified ? "success" : "warning"}>
                  {emailVerified ? t.emailVerified : t.emailUnverified}
                </Badge>
              </div>
            </div>
            <form action={avatarAction} className="space-y-2">
              <label className="block text-xs font-medium text-zt-muted">
                {t.avatarUpload}
                <input
                  type="file"
                  name="avatar"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  required
                  className="mt-1 block w-full text-xs text-zt-muted file:mr-3 file:rounded-lg file:border-0 file:bg-zt-primary/15 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zt-primary"
                />
              </label>
              <button type="submit" disabled={avatarPending} className={ghostClass}>
                {avatarPending ? t.uploading : t.uploadAvatar}
              </button>
              {avatarState.message ? (
                <p
                  className={`text-xs ${avatarState.status === "error" ? "text-zt-danger" : "text-zt-success"}`}
                >
                  {avatarState.message}
                </p>
              ) : null}
            </form>
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.04}>
        <Panel>
          <PanelHeader>
            <PanelTitle>{t.sectionTitle}</PanelTitle>
            <PanelDescription>{t.sectionDesc}</PanelDescription>
          </PanelHeader>
          <PanelContent>
            <form action={profileAction} className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-zt-muted sm:col-span-2">
                {t.displayName}
                <input
                  name="fullName"
                  required
                  defaultValue={profile.full_name ?? ""}
                  className={inputClass}
                />
              </label>
              <label className="space-y-1 text-xs text-zt-muted sm:col-span-2">
                {t.avatarUrl}
                <input
                  name="avatarUrl"
                  type="url"
                  defaultValue={profile.avatar_url ?? ""}
                  className={inputClass}
                  placeholder="https://"
                />
              </label>
              <label className="space-y-1 text-xs text-zt-muted">
                {t.language}
                <select
                  name="language"
                  defaultValue={profile.language ?? "en"}
                  className={inputClass}
                >
                  <option value="en">English</option>
                  <option value="tr">Türkçe</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                </select>
              </label>
              <label className="space-y-1 text-xs text-zt-muted">
                {t.timezone}
                <input
                  name="timezone"
                  defaultValue={profile.timezone ?? "UTC"}
                  className={inputClass}
                  placeholder="UTC"
                />
              </label>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button type="submit" disabled={profilePending} className={buttonClass}>
                  {profilePending ? common.saving : t.saveProfile}
                </button>
                {profileState.message ? (
                  <span
                    className={`text-xs ${profileState.status === "error" ? "text-zt-danger" : "text-zt-success"}`}
                  >
                    {profileState.message}
                  </span>
                ) : null}
              </div>
            </form>
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.08}>
        <Panel>
          <PanelHeader>
            <PanelTitle>{t.emailSectionTitle}</PanelTitle>
            <PanelDescription>{t.emailSectionDesc}</PanelDescription>
          </PanelHeader>
          <PanelContent className="space-y-4">
            <form action={emailAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1 space-y-1 text-xs text-zt-muted">
                {t.email}
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={profile.email}
                  className={inputClass}
                />
              </label>
              <button type="submit" disabled={emailPending} className={buttonClass}>
                {emailPending ? common.saving : t.updateEmail}
              </button>
            </form>
            {!emailVerified ? (
              <form action={verifyAction}>
                <button type="submit" disabled={verifyPending} className={ghostClass}>
                  {verifyPending ? t.sending : t.resendVerification}
                </button>
              </form>
            ) : null}
            {emailState.message || verifyState.message ? (
              <p
                className={`text-xs ${(emailState.status === "error" || verifyState.status === "error") ? "text-zt-danger" : "text-zt-success"}`}
              >
                {emailState.message ?? verifyState.message}
              </p>
            ) : null}
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.12}>
        <Panel>
          <PanelHeader>
            <PanelTitle>{t.changePassword}</PanelTitle>
            <PanelDescription>
              {profile.password_changed_at
                ? t.lastChanged
                    .replace("{rel}", formatRelativeTime(profile.password_changed_at, undefined, locale))
                    .replace("{date}", formatDate(profile.password_changed_at))
                : t.noPasswordChange}
            </PanelDescription>
          </PanelHeader>
          <PanelContent>
            <form action={passwordAction} className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1 text-xs text-zt-muted">
                {t.currentPassword}
                <input
                  name="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                />
              </label>
              <label className="space-y-1 text-xs text-zt-muted">
                {t.newPassword}
                <input
                  name="newPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>
              <label className="space-y-1 text-xs text-zt-muted">
                {t.confirmPassword}
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>
              <div className="flex items-center gap-3 sm:col-span-3">
                <button type="submit" disabled={passwordPending} className={buttonClass}>
                  {passwordPending ? t.updating : t.updatePassword}
                </button>
                {passwordState.message ? (
                  <span
                    className={`text-xs ${passwordState.status === "error" ? "text-zt-danger" : "text-zt-success"}`}
                  >
                    {passwordState.message}
                  </span>
                ) : null}
              </div>
            </form>
          </PanelContent>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.16}>
        <Panel className="border-zt-danger/30">
          <PanelHeader>
            <PanelTitle>{t.deleteAccount}</PanelTitle>
            <PanelDescription>
              {t.deleteAccountDesc} {t.deleteAccountHint}
            </PanelDescription>
          </PanelHeader>
          <PanelContent>
            <form action={deleteAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1 space-y-1 text-xs text-zt-muted">
                {t.confirmation}
                <input
                  name="confirmation"
                  required
                  placeholder="DELETE"
                  className={inputClass}
                />
              </label>
              <button
                type="submit"
                disabled={deletePending}
                className="rounded-lg border border-zt-danger/40 px-3 py-2 text-sm text-zt-danger transition-colors hover:bg-zt-danger/10 disabled:opacity-60"
              >
                {deletePending ? t.deleting : t.deleteAccountConfirm}
              </button>
            </form>
            {deleteState.message ? (
              <p className="mt-2 text-xs text-zt-danger">{deleteState.message}</p>
            ) : null}
          </PanelContent>
        </Panel>
      </FadeIn>
    </div>
  );
}
