import { AxiosErrorCollector } from "./axios.collector";
import { ConsoleCollector } from "./console.collector";
import { GlobalErrorCollector } from "./global-error.collector";
import { HeartbeatCollector } from "./heartbeat.collector";
import { NetworkErrorCollector } from "./network.collector";
import { PerformanceCollector } from "./performance.collector";
import { PromiseRejectionCollector } from "./promise-rejection.collector";
import { ResourceErrorCollector } from "./resource.collector";
import type { Collector, CollectorHost } from "./base";

export type { Collector, CollectorHost } from "./base";

/** Builds the enabled set of collectors for the given host. */
export function buildCollectors(host: CollectorHost): Collector[] {
  const collectors: Collector[] = [
    new GlobalErrorCollector(host),
    new PromiseRejectionCollector(host),
  ];

  if (host.config.captureResources) {
    collectors.push(new ResourceErrorCollector(host));
  }
  if (host.config.captureConsole) {
    collectors.push(new ConsoleCollector(host));
  }
  if (host.config.captureNetwork) {
    collectors.push(new NetworkErrorCollector(host));
  }

  // Axios collector self-disables when no axios instance is present.
  collectors.push(new AxiosErrorCollector(host));

  if (host.config.capturePerformance) {
    collectors.push(new PerformanceCollector(host));
  }
  if (host.config.captureHeartbeat) {
    collectors.push(new HeartbeatCollector(host));
  }

  return collectors;
}
