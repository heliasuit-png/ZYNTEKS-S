/** Captures unhandled promise rejections. */
export class PromiseRejectionCollector {
    constructor(host) {
        this.host = host;
    }
    start() {
        this.handler = (event) => {
            const reason = event.reason;
            if (reason instanceof Error) {
                this.host.reportError({
                    message: reason.message,
                    stack: reason.stack ?? null,
                    type: reason.name || "UnhandledRejection",
                    level: "error",
                });
                return;
            }
            this.host.reportError({
                message: typeof reason === "string" ? reason : "Unhandled promise rejection",
                stack: null,
                type: "UnhandledRejection",
                level: "error",
            });
        };
        window.addEventListener("unhandledrejection", this.handler);
    }
    stop() {
        if (this.handler) {
            window.removeEventListener("unhandledrejection", this.handler);
        }
    }
}
//# sourceMappingURL=promise-rejection.collector.js.map