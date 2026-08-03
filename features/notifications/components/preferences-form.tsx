"use client";

import { useActionState } from "react";

import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_CHANNELS,
} from "@/lib/constants";
import { updateNotificationPreferencesAction } from "@/features/notifications/actions";
import {
  defaultTypePreferences,
  parseTypePreferences,
  resolveCategoryChannelPrefs,
} from "@/features/notifications/lib/categories";
import { initialPreferencesFormState } from "@/features/notifications/types";
import type { NotificationPreferences } from "@/services/notifications";

interface PreferencesFormProps {
  preferences: NotificationPreferences | null;
}

interface ToggleProps {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}

function Toggle({ name, label, description, defaultChecked }: ToggleProps) {
  return (
    <label className="flex items-start justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zt-text">{label}</span>
        <span className="block text-xs text-zt-muted">{description}</span>
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 shrink-0 accent-zt-primary"
        aria-label={label}
      />
    </label>
  );
}

export function NotificationPreferencesForm({
  preferences,
}: PreferencesFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateNotificationPreferencesAction,
    initialPreferencesFormState,
  );

  const typePrefs = preferences?.type_preferences
    ? parseTypePreferences(preferences.type_preferences)
    : defaultTypePreferences();

  return (
    <form action={formAction} className="space-y-6">
      <div className="divide-y divide-zt-border">
        <Toggle
          name="dashboard_enabled"
          label="Dashboard notifications"
          description="Show notifications in the in-app notification center."
          defaultChecked={preferences?.dashboard_enabled ?? true}
        />
        <Toggle
          name="email_enabled"
          label="Email notifications"
          description="Send transactional emails for important events."
          defaultChecked={preferences?.email_enabled ?? true}
        />
        <Toggle
          name="slack_enabled"
          label="Slack notifications"
          description="Post to a Slack incoming webhook."
          defaultChecked={preferences?.slack_enabled ?? false}
        />
        <div className="space-y-1.5 py-3">
          <label
            htmlFor="slack_webhook_url"
            className="block text-xs font-medium text-zt-muted"
          >
            Slack webhook URL
          </label>
          <input
            id="slack_webhook_url"
            type="url"
            name="slack_webhook_url"
            defaultValue={preferences?.slack_webhook_url ?? ""}
            placeholder="https://hooks.slack.com/services/…"
            autoComplete="off"
            className="w-full rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-text outline-none transition-colors focus:border-zt-primary"
          />
        </div>
        <Toggle
          name="discord_enabled"
          label="Discord notifications"
          description="Post to a Discord webhook."
          defaultChecked={preferences?.discord_enabled ?? false}
        />
        <div className="space-y-1.5 py-3">
          <label
            htmlFor="discord_webhook_url"
            className="block text-xs font-medium text-zt-muted"
          >
            Discord webhook URL
          </label>
          <input
            id="discord_webhook_url"
            type="url"
            name="discord_webhook_url"
            defaultValue={preferences?.discord_webhook_url ?? ""}
            placeholder="https://discord.com/api/webhooks/…"
            autoComplete="off"
            className="w-full rounded-xl border border-zt-border bg-zt-surface-2 px-3 py-2 text-sm text-zt-text outline-none transition-colors focus:border-zt-primary"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-zt-text">
            Per notification type
          </h3>
          <p className="text-xs text-zt-muted">
            Enable or disable Email, Dashboard, Slack, and Discord for each
            category.
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-zt-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zt-border bg-zt-surface-2/60 text-xs uppercase tracking-wide text-zt-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Type
                </th>
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <th
                    key={channel}
                    scope="col"
                    className="px-3 py-2 text-center font-medium"
                  >
                    {NOTIFICATION_CHANNEL_LABELS[channel]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zt-border">
              {NOTIFICATION_CATEGORIES.map((category) => {
                const prefs = resolveCategoryChannelPrefs(typePrefs, category);
                return (
                  <tr key={category}>
                    <th
                      scope="row"
                      className="whitespace-nowrap px-3 py-2.5 font-medium text-zt-text"
                    >
                      {NOTIFICATION_CATEGORY_LABELS[category]}
                    </th>
                    {NOTIFICATION_CHANNELS.map((channel) => (
                      <td key={channel} className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          name={`type_${category}_${channel}`}
                          defaultChecked={prefs[channel]}
                          aria-label={`${NOTIFICATION_CATEGORY_LABELS[category]} ${NOTIFICATION_CHANNEL_LABELS[channel]}`}
                          className="size-4 accent-zt-primary"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zt-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zt-primary/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save preferences"}
        </button>
        {state.status === "success" ? (
          <span className="text-xs text-zt-success" role="status">
            {state.message}
          </span>
        ) : null}
        {state.status === "error" ? (
          <span className="text-xs text-zt-danger" role="alert">
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
