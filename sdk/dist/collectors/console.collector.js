/** Captures `console.error` calls while preserving the original behavior. */
export class ConsoleCollector {
    constructor(host) {
        this.host = host;
        this.capturing = false;
    }
    start() {
        if (typeof console === "undefined") {
            return;
        }
        const original = console.error.bind(console);
        this.original = original;
        const collector = this;
        console.error = function patchedConsoleError(...args) {
            original(...args);
            if (collector.capturing) {
                return;
            }
            collector.capturing = true;
            try {
                const message = args.map((arg) => collector.stringify(arg)).join(" ");
                const errorArg = args.find((arg) => arg instanceof Error);
                collector.host.reportError({
                    message: message || "console.error",
                    stack: errorArg?.stack ?? null,
                    type: "console.error",
                    level: "error",
                });
            }
            finally {
                collector.capturing = false;
            }
        };
    }
    stop() {
        if (this.original) {
            console.error = this.original;
        }
    }
    stringify(value) {
        if (typeof value === "string") {
            return value;
        }
        if (value instanceof Error) {
            return value.message;
        }
        try {
            return JSON.stringify(value);
        }
        catch {
            return String(value);
        }
    }
}
//# sourceMappingURL=console.collector.js.map