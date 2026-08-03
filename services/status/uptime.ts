export interface DowntimeInterval {
  start: number;
  end: number;
}

/** Merges overlapping intervals so downtime is never double counted. */
function mergeIntervals(intervals: DowntimeInterval[]): DowntimeInterval[] {
  if (intervals.length === 0) {
    return [];
  }
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: DowntimeInterval[] = [{ ...sorted[0]! }];
  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

/** Total downtime (ms) that falls inside [windowStart, windowEnd]. */
export function totalDowntimeMs(
  intervals: DowntimeInterval[],
  windowStart: number,
  windowEnd: number,
): number {
  const merged = mergeIntervals(intervals);
  let total = 0;
  for (const interval of merged) {
    const start = Math.max(interval.start, windowStart);
    const end = Math.min(interval.end, windowEnd);
    if (end > start) {
      total += end - start;
    }
  }
  return total;
}

/** Uptime percentage over a window, clamped to [0, 100]. */
export function uptimePercent(
  intervals: DowntimeInterval[],
  windowStart: number,
  windowEnd: number,
): number {
  const windowMs = windowEnd - windowStart;
  if (windowMs <= 0) {
    return 100;
  }
  const downtime = totalDowntimeMs(intervals, windowStart, windowEnd);
  const percent = ((windowMs - downtime) / windowMs) * 100;
  return Math.max(0, Math.min(100, Math.round(percent * 1000) / 1000));
}
