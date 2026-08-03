import type { Collector, CollectorHost } from "./base";

/**
 * Captures resource loading failures (scripts, images, stylesheets). Resource
 * `error` events do not bubble, so a capture-phase listener is required.
 */
export class ResourceErrorCollector implements Collector {
  private handler?: (event: Event) => void;

  constructor(private readonly host: CollectorHost) {}

  start(): void {
    this.handler = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const element = target as Element & { src?: string; href?: string };
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

  stop(): void {
    if (this.handler) {
      window.removeEventListener("error", this.handler, true);
    }
  }
}
