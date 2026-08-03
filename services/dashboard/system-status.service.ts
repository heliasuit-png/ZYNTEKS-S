import { getHealthSummary } from "@/services/dashboard/health.service";
import type { SystemStatus } from "@/types/dashboard";

/**
 * Aggregates platform status for the dashboard home from live health probes.
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  const health = await getHealthSummary();
  const components = health.services.map((service) => ({
    id: service.id,
    name: service.name,
    state: service.state,
  }));

  return {
    overall: health.state,
    components,
    updatedAt: new Date().toISOString(),
  };
}
