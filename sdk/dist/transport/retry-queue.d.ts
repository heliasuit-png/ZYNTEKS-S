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
export declare class RetryQueue {
    private readonly maxAttempts;
    private readonly send;
    private readonly onExhausted;
    private readonly timers;
    constructor(maxAttempts: number, send: (item: RetryItem) => Promise<SendResult>, onExhausted: (item: RetryItem) => void);
    push(kind: PayloadKind, body: string): void;
    private run;
    private backoff;
    clear(): void;
}
//# sourceMappingURL=retry-queue.d.ts.map