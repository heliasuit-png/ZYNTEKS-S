const STORAGE_KEY = "__zynteksis_offline_queue__";
/**
 * Persists failed requests in localStorage so they survive reloads and can be
 * replayed once connectivity is restored.
 */
export class OfflineQueue {
    constructor(maxSize) {
        this.maxSize = maxSize;
    }
    available() {
        try {
            return typeof localStorage !== "undefined";
        }
        catch {
            return false;
        }
    }
    read() {
        if (!this.available()) {
            return [];
        }
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return [];
            }
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    write(items) {
        if (!this.available()) {
            return;
        }
        try {
            const trimmed = items.slice(-this.maxSize);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        }
        catch {
            // Storage full or unavailable; drop silently.
        }
    }
    add(item) {
        const items = this.read();
        items.push(item);
        this.write(items);
    }
    all() {
        return this.read();
    }
    remove(id) {
        this.write(this.read().filter((item) => item.id !== id));
    }
    clear() {
        if (!this.available()) {
            return;
        }
        try {
            localStorage.removeItem(STORAGE_KEY);
        }
        catch {
            // ignore
        }
    }
}
//# sourceMappingURL=offline-queue.js.map