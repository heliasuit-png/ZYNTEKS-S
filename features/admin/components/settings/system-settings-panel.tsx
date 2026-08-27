"use client";

import { useState, useTransition } from "react";

import { useDictionary } from "@/components/i18n/locale-provider";
import type {
  SecuritySettingsMeta,
  SystemSettingsMeta,
} from "@/services/admin/platform-settings.types";
import { updatePlatformSettingsAction } from "@/features/admin/settings-actions";

export function SystemSettingsPanel({
  system,
  security,
  platformName,
  canWrite,
}: {
  system: SystemSettingsMeta;
  security: SecuritySettingsMeta;
  platformName: string;
  canWrite: boolean;
}) {
  const { dict } = useDictionary();
  const t = dict.admin.settings;
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await updatePlatformSettingsAction({
        platformName: String(formData.get("platformName") ?? ""),
        maintenanceEnabled: formData.get("maintenanceEnabled") === "on",
        maintenanceMessage: String(formData.get("maintenanceMessage") ?? ""),
        registrationEnabled: formData.get("registrationEnabled") === "on",
        passwordMinLength: Number(formData.get("passwordMinLength")),
        sessionTimeoutHours: Number(formData.get("sessionTimeoutHours")),
        mfaRequired: formData.get("mfaRequired") === "on",
      });
      setMessage(result.message);
    });
  }

  if (!canWrite) {
    return (
      <div className="space-y-3 text-sm text-[var(--admin-muted)]">
        <p>
          {t.maintenance}:{" "}
          <span className="text-[var(--admin-text)]">
            {system.maintenanceEnabled ? t.on : t.off}
          </span>
        </p>
        <p>
          {t.registration}:{" "}
          <span className="text-[var(--admin-text)]">
            {system.registrationEnabled ? t.enabled : t.disabled}
          </span>
        </p>
        <p className="text-xs">{t.readOnly}</p>
      </div>
    );
  }

  return (
    <form action={save} className="space-y-4">
      {message ? (
        <p className="rounded-xl border border-[var(--admin-border-strong)] bg-[var(--admin-accent-soft)] px-3 py-2 text-xs text-[var(--admin-accent-text)]">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block text-xs text-[var(--admin-muted)]">
          {t.platformName}
          <input
            name="platformName"
            defaultValue={platformName}
            required
            className="admin-select mt-1 w-full"
          />
        </label>
        <label className="block text-xs text-[var(--admin-muted)]">
          {t.passwordMinLength}
          <input
            name="passwordMinLength"
            type="number"
            min={6}
            max={128}
            defaultValue={security.passwordPolicy.minLength}
            required
            className="admin-select mt-1 w-full"
          />
        </label>
        <label className="block text-xs text-[var(--admin-muted)]">
          {t.sessionTimeoutHours}
          <input
            name="sessionTimeoutHours"
            type="number"
            min={1}
            max={8760}
            defaultValue={security.sessionTimeoutHours}
            required
            className="admin-select mt-1 w-full"
          />
        </label>
        <label className="block text-xs text-[var(--admin-muted)] lg:col-span-2">
          {t.maintenanceMessage}
          <textarea
            name="maintenanceMessage"
            defaultValue={system.maintenanceMessage ?? ""}
            rows={2}
            className="admin-select mt-1 w-full"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-5 text-sm text-[var(--admin-text)]">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="maintenanceEnabled"
            defaultChecked={system.maintenanceEnabled}
            className="size-4 rounded border-[var(--admin-border)] bg-transparent"
          />
          {t.maintenanceMode}
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="registrationEnabled"
            defaultChecked={system.registrationEnabled}
            className="size-4 rounded border-[var(--admin-border)] bg-transparent"
          />
          {t.registrationEnabled}
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="mfaRequired"
            defaultChecked={security.mfaRequired}
            className="size-4 rounded border-[var(--admin-border)] bg-transparent"
          />
          {t.mfaRequired}
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {t.saveSystemSettings}
      </button>
    </form>
  );
}
