function toBcp47(locale?: string): string {
  return locale === "tr" ? "tr" : "en";
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    value,
  );
}

export function formatPercent(value: number): string {
  return `${value.toFixed(value >= 99.95 ? 3 : 2)}%`;
}

export function formatMs(value: number | null): string {
  if (value == null) return "—";
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatRelative(iso: string, locale: string = "en"): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(deltaMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(toBcp47(locale), { numeric: "auto" });
  if (Math.abs(minutes) < 1) return rtf.format(0, "second"); // "now" / "şimdi"
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  return rtf.format(-days, "day");
}
