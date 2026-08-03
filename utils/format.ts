/**
 * Pure, framework-agnostic formatting helpers.
 */

export function formatDate(
  date: Date | string | number,
  locale = "en-US",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/** Formats a date with both date and time components. */
export function formatDateTime(
  date: Date | string | number,
  locale = "en-US",
): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Formats a timestamp as a human-readable relative time (e.g. "3m ago"). */
export function formatRelativeTime(
  date: Date | string | number,
  now: Date = new Date(),
): string {
  const then = new Date(date).getTime();
  const diffMs = now.getTime() - then;
  const diffSec = Math.round(diffMs / 1000);

  if (Number.isNaN(then)) {
    return "";
  }
  if (Math.abs(diffSec) < 45) {
    return "just now";
  }

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSec) >= seconds || unit === "second") {
      const valueInUnit = Math.round(diffSec / seconds);
      return rtf.format(-valueInUnit, unit);
    }
  }
  return "just now";
}

/** Formats a duration in seconds into a compact human string (e.g. "1h 5m"). */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) {
    return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}
