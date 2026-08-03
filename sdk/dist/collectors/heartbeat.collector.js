const INITIAL_DELAY_MS = 1000;
/** Emits a heartbeat immediately after startup and then on a fixed interval. */
export class HeartbeatCollector {
    constructor(host) {
        this.host = host;
    }
    start() {
        this.initial = setTimeout(() => {
            this.host.reportHeartbeat();
        }, INITIAL_DELAY_MS);
        this.interval = setInterval(() => {
            this.host.reportHeartbeat();
        }, this.host.config.heartbeatInterval);
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        if (this.initial) {
            clearTimeout(this.initial);
        }
    }
}
//# sourceMappingURL=heartbeat.collector.js.map