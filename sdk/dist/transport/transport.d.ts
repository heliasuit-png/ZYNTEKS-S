import type { InternalLogger } from "../utils/logger";
import type { IngestPayload, PayloadKind, ResolvedConfig } from "../types";
/**
 * Transport layer. Serializes payloads, optionally compresses them, sends them
 * with retry/backoff, and persists failures to an offline queue that is
 * replayed when connectivity returns.
 */
export declare class Transport {
    private readonly config;
    private readonly logger;
    private readonly offline;
    private readonly retry;
    private started;
    private onlineHandler?;
    constructor(config: ResolvedConfig, logger: InternalLogger);
    start(): void;
    send(kind: PayloadKind, payload: IngestPayload): void;
    private post;
    private flushOffline;
    close(): void;
}
//# sourceMappingURL=transport.d.ts.map