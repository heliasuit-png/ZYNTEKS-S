import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPE_CATEGORY,
  type NotificationCategory,
} from "@/lib/constants";
import type { NotificationChannel, NotificationType } from "@/types/database";

export type CategoryChannelPrefs = Record<NotificationChannel, boolean>;
export type TypePreferencesMap = Partial<
  Record<NotificationCategory, Partial<CategoryChannelPrefs>>
>;

const DEFAULT_CHANNEL_PREFS: CategoryChannelPrefs = {
  email: true,
  dashboard: true,
  slack: true,
  discord: true,
};

export function categoryForType(type: NotificationType): NotificationCategory {
  return NOTIFICATION_TYPE_CATEGORY[type];
}

export function typesForCategory(
  category: NotificationCategory,
): NotificationType[] {
  return (
    Object.entries(NOTIFICATION_TYPE_CATEGORY) as [
      NotificationType,
      NotificationCategory,
    ][]
  )
    .filter(([, cat]) => cat === category)
    .map(([type]) => type);
}

export function parseTypePreferences(raw: unknown): TypePreferencesMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const result: TypePreferencesMap = {};
  for (const category of NOTIFICATION_CATEGORIES) {
    const entry = (raw as Record<string, unknown>)[category];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const channels = entry as Record<string, unknown>;
    result[category] = {
      email: channels.email !== false,
      dashboard: channels.dashboard !== false,
      slack: channels.slack !== false,
      discord: channels.discord !== false,
    };
  }
  return result;
}

export function resolveCategoryChannelPrefs(
  map: TypePreferencesMap,
  category: NotificationCategory,
): CategoryChannelPrefs {
  const entry = map[category];
  return {
    email: entry?.email ?? DEFAULT_CHANNEL_PREFS.email,
    dashboard: entry?.dashboard ?? DEFAULT_CHANNEL_PREFS.dashboard,
    slack: entry?.slack ?? DEFAULT_CHANNEL_PREFS.slack,
    discord: entry?.discord ?? DEFAULT_CHANNEL_PREFS.discord,
  };
}

/** Returns true when the category allows delivery on the given channel. */
export function isCategoryChannelEnabled(
  map: TypePreferencesMap,
  category: NotificationCategory,
  channel: NotificationChannel,
): boolean {
  return resolveCategoryChannelPrefs(map, category)[channel] !== false;
}

export function defaultTypePreferences(): TypePreferencesMap {
  const map: TypePreferencesMap = {};
  for (const category of NOTIFICATION_CATEGORIES) {
    map[category] = { ...DEFAULT_CHANNEL_PREFS };
  }
  return map;
}
