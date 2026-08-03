/** Captures uncaught JavaScript errors via the window `error` event. */
export class GlobalErrorCollector {
    constructor(host) {
        this.host = host;
    }
    start() {
        this.handler = (event) => {
            const error = event.error;
            if (error instanceof Error) {
                this.host.reportError({
                    message: error.message,
                    stack: error.stack ?? null,
                    type: error.name || "Error",
                    level: "error",
                });
                return;
            }
            this.host.reportError({
                message: event.message || "Uncaught error",
                stack: null,
                type: "Error",
                level: "error",
            });
        };
        window.addEventListener("error", this.handler);
    }
    stop() {
        if (this.handler) {
            window.removeEventListener("error", this.handler);
        }
    }
}
//# sourceMappingURL=global-error.collector.js.map