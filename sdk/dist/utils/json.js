/** Serializes a value to JSON, dropping circular references safely. */
export function safeStringify(value) {
    const seen = new WeakSet();
    return JSON.stringify(value, (_key, val) => {
        if (typeof val === "object" && val !== null) {
            if (seen.has(val)) {
                return "[Circular]";
            }
            seen.add(val);
        }
        return val;
    });
}
/** Returns the UTF-8 byte length of a string. */
export function byteLength(value) {
    if (typeof TextEncoder !== "undefined") {
        return new TextEncoder().encode(value).length;
    }
    // Fallback: approximate assuming worst-case multi-byte characters.
    return value.length * 3;
}
/** Truncates a string to a maximum length, appending an ellipsis marker. */
export function truncate(value, max) {
    if (value.length <= max) {
        return value;
    }
    return `${value.slice(0, Math.max(0, max - 1))}…`;
}
//# sourceMappingURL=json.js.map