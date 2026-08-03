import type { PayloadKind } from "../types";

export interface RetryItem {
  kind: PayloadKind;
  body: string;
  attempts: number;
}

export type SendResult = "ok" | "retry" | "drop";

/**
 * In-memory retry queue with exponential backoff and jitter. Items that
 * exhaust their attempts are handed to {@link onExhausted} for offline
 * persistence.
 */
export class RetryQueue {
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(
    private readonly maxAttempts: number,
    private readonly send: (item: RetryItem) => Promise<SendResult>,
    private readonly onExhausted: (item: RetryItem) => void,
  ) {}

  push(kind: PayloadKind, body: string): void {
    void this.run({ kind, body, attempts: 0 });
  }

  private async run(item: RetryItem): Promise<void> {
    const result = await this.send(item);
    if (result === "ok" || result === "drop") {
      return;
    }

    item.attempts += 1;
    if (item.attempts >= this.maxAttempts) {
      this.onExhausted(item);
      return;
    }

    const delay = this.backoff(item.attempts);
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      void this.run(item);
    }, delay);
    this.timers.add(timer);
  }

  private backoff(attempt: number): number {
    const base = Math.min(30000, 1000 * 2 ** attempt);
    return base + Math.floor(Math.random() * base * 0.2);
  }

  clear(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
