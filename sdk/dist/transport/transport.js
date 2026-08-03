import { resolveUrl } from "./endpoints";
import { gzip, supportsCompression } from "./compression";
import { OfflineQueue } from "./offline-queue";
import { RetryQueue } from "./retry-queue";
import { byteLength, safeStringify } from "../utils/json";
import { isBrowser } from "../utils/environment";
import { uuid } from "../utils/id";
import { nowMs } from "../utils/time";
const COMPRESS_THRESHOLD = 1024;
const MAX_ATTEMPTS = 5;
const KEEPALIVE_MAX_BYTES = 60000;
/**
 * Transport layer. Serializes payloads, optionally compresses them, sends them
 * with retry/backoff, and persists failures to an offline queue that is
 * replayed when connectivity returns.
 */
export class Transport {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.started = false;
        this.offline = new OfflineQueue(config.maxQueueSize);
        this.retry = new RetryQueue(MAX_ATTEMPTS, (item) => this.post(item.kind, item.body), (item) => {
            this.offline.add({
                id: uuid(),
                kind: item.kind,
                body: item.body,
                createdAt: nowMs(),
            });
        });
    }
    start() {
        if (this.started) {
            return;
        }
        this.started = true;
        if (isBrowser()) {
            this.onlineHandler = () => this.flushOffline();
            window.addEventListener("online", this.onlineHandler);
        }
        this.flushOffline();
    }
    send(kind, payload) {
        let body;
        try {
            body = safeStringify(payload);
        }
        catch {
            return;
        }
        if (byteLength(body) > this.config.maxPayloadBytes) {
            this.logger.warn("payload exceeds max size; dropping", kind);
            return;
        }
        this.retry.push(kind, body);
    }
    async post(kind, body) {
        if (typeof fetch === "undefined") {
            return "drop";
        }
        const url = resolveUrl(this.config.endpoint, kind);
        const headers = {
            "content-type": "application/json",
            "x-zynteksis-key": this.config.apiKey,
        };
        let payloadBody = body;
        if (this.config.compress &&
            supportsCompression() &&
            byteLength(body) > COMPRESS_THRESHOLD) {
            const compressed = await gzip(body);
            if (compressed) {
                payloadBody = compressed;
                headers["content-encoding"] = "gzip";
            }
        }
        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: payloadBody,
                mode: "cors",
                credentials: "omit",
                keepalive: byteLength(body) < KEEPALIVE_MAX_BYTES,
            });
            if (response.ok) {
                return "ok";
            }
            if (response.status === 429 || response.status >= 500) {
                return "retry";
            }
            return "drop";
        }
        catch {
            return "retry";
        }
    }
    flushOffline() {
        if (!this.offline.available()) {
            return;
        }
        if (isBrowser() &&
            typeof navigator !== "undefined" &&
            navigator.onLine === false) {
            return;
        }
        for (const item of this.offline.all()) {
            void this.post(item.kind, item.body).then((result) => {
                if (result === "ok" || result === "drop") {
                    this.offline.remove(item.id);
                }
            });
        }
    }
    close() {
        this.retry.clear();
        if (isBrowser() && this.onlineHandler) {
            window.removeEventListener("online", this.onlineHandler);
        }
        this.started = false;
    }
}
//# sourceMappingURL=transport.js.map