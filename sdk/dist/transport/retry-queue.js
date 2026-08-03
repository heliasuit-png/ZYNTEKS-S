/**
 * In-memory retry queue with exponential backoff and jitter. Items that
 * exhaust their attempts are handed to {@link onExhausted} for offline
 * persistence.
 */
export class RetryQueue {
    constructor(maxAttempts, send, onExhausted) {
        this.maxAttempts = maxAttempts;
        this.send = send;
        this.onExhausted = onExhausted;
        this.timers = new Set();
    }
    push(kind, body) {
        void this.run({ kind, body, attempts: 0 });
    }
    async run(item) {
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
    backoff(attempt) {
        const base = Math.min(30000, 1000 * 2 ** attempt);
        return base + Math.floor(Math.random() * base * 0.2);
    }
    clear() {
        for (const timer of this.timers) {
            clearTimeout(timer);
        }
        this.timers.clear();
    }
}
//# sourceMappingURL=retry-queue.js.map