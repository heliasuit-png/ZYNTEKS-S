/**
 * Holds a reference to the active client so framework integrations (e.g. the
 * React error boundary) can report without an explicit instance.
 */
let currentClient = null;
export function setCurrentClient(client) {
    currentClient = client;
}
export function getCurrentClient() {
    return currentClient;
}
//# sourceMappingURL=registry.js.map