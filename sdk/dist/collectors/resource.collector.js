/**
 * Captures resource loading failures (scripts, images, stylesheets). Resource
 * `error` events do not bubble, so a capture-phase listener is required.
 */
export class ResourceErrorCollector {
    constructor(host) {
        this.host = host;
    }
    start() {
        this.handler = (event) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }
            const element = target;
            const url = element.src ?? element.href;
            if (!url) {
                return;
            }
            this.host.reportError({
                message: `Failed to load ${element.tagName.toLowerCase()} resource: ${url}`,
                stack: null,
                type: "ResourceError",
                level: "warning",
            });
        };
        window.addEventListener("error", this.handler, true);
    }
    stop() {
        if (this.handler) {
            window.removeEventListener("error", this.handler, true);
        }
    }
}
//# sourceMappingURL=resource.collector.js.map