import type { PayloadKind } from "../types";

export interface QueuedRequest {
  id: string;
  kind: PayloadKind;
  body: string;
  createdAt: number;
}

const STORAGE_KEY = "__zynteksis_offline_queue__";

/**
 * Persists failed requests in localStorage so they survive reloads and can be
 * replayed once connectivity is restored.
 */
export class OfflineQueue {
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  available(): boolean {
    try {
      return typeof localStorage !== "undefined";
    } catch {
      return false;
    }
  }

  private read(): QueuedRequest[] {
    if (!this.available()) {
      return [];
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as QueuedRequest[]) : [];
    } catch {
      return [];
    }
  }

  private write(items: QueuedRequest[]): void {
    if (!this.available()) {
      return;
    }
    try {
      const trimmed = items.slice(-this.maxSize);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Storage full or unavailable; drop silently.
    }
  }

  add(item: QueuedRequest): void {
    const items = this.read();
    items.push(item);
    this.write(items);
  }

  all(): QueuedRequest[] {
    return this.read();
  }

  remove(id: string): void {
    this.write(this.read().filter((item) => item.id !== id));
  }

  clear(): void {
    if (!this.available()) {
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
