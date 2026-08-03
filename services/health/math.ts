/** Shared numeric helpers for health scoring and latency percentiles. */

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number): number {
  return Math.round(value);
}

export function percentile(sortedAsc: number[], p: number): number | null {
  if (sortedAsc.length === 0) return null;
  if (sortedAsc.length === 1) return sortedAsc[0]!;
  const rank = (p / 100) * (sortedAsc.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sortedAsc[low]!;
  const weight = rank - low;
  return sortedAsc[low]! * (1 - weight) + sortedAsc[high]! * weight;
}

export function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function scoreMetric(
  value: number | null,
  good: number,
  ok: number,
): number | null {
  if (value === null || Number.isNaN(value)) return null;
  if (value <= good) return 100;
  if (value <= ok) return 70;
  return 40;
}

export function severityWeight(sev: string): number {
  switch (sev) {
    case "critical":
      return 25;
    case "high":
      return 15;
    case "medium":
      return 8;
    default:
      return 4;
  }
}

export function toMb(bytes: number | null | undefined): number | null {
  if (bytes == null || Number.isNaN(bytes)) return null;
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}
