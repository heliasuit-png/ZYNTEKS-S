import type { CaptureClient } from "../types";

/**
 * Holds a reference to the active client so framework integrations (e.g. the
 * React error boundary) can report without an explicit instance.
 */
let currentClient: CaptureClient | null = null;

export function setCurrentClient(client: CaptureClient | null): void {
  currentClient = client;
}

export function getCurrentClient(): CaptureClient | null {
  return currentClient;
}
