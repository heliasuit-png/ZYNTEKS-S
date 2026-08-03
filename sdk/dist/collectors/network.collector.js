/**
 * Wraps `fetch` to capture network failures and server (5xx) responses without
 * altering the caller-visible behavior.
 */
export class NetworkErrorCollector {
    constructor(host) {
        this.host = host;
    }
    start() {
        if (typeof window === "undefined" || typeof window.fetch !== "function") {
            return;
        }
        const original = window.fetch.bind(window);
        this.original = original;
        const host = this.host;
        const describe = this.describe;
        window.fetch = async function patchedFetch(input, init) {
            try {
                const response = await original(input, init);
                if (response.status >= 500) {
                    host.reportError({
                        message: `HTTP ${response.status} on ${describe(input)}`,
                        stack: null,
                        type: "network",
                        level: "error",
                    });
                }
                return response;
            }
            catch (error) {
                host.reportError({
                    message: `Network request failed: ${describe(input)}`,
                    stack: error instanceof Error ? (error.stack ?? null) : null,
                    type: "network",
                    level: "error",
                });
                throw error;
            }
        };
    }
    stop() {
        if (this.original) {
            window.fetch = this.original;
        }
    }
    describe(input) {
        if (typeof input === "string") {
            return input;
        }
        if (input instanceof URL) {
            return input.href;
        }
        return input.url;
    }
}
//# sourceMappingURL=network.collector.js.map