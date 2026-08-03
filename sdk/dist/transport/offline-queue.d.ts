import type { PayloadKind } from "../types";
export interface QueuedRequest {
    id: string;
    kind: PayloadKind;
    body: string;
    createdAt: number;
}
/**
 * Persists failed requests in localStorage so they survive reloads and can be
 * replayed once connectivity is restored.
 */
export declare class OfflineQueue {
    private readonly maxSize;
    constructor(maxSize: number);
    available(): boolean;
    private read;
    private write;
    add(item: QueuedRequest): void;
    all(): QueuedRequest[];
    remove(id: string): void;
    clear(): void;
}
//# sourceMappingURL=offline-queue.d.ts.map