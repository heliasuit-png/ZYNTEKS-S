/**
 * Optional gzip compression layer using the platform CompressionStream API.
 * Falls back to no compression when unsupported.
 */
function getCompressionStream() {
    const ctor = globalThis.CompressionStream;
    return typeof ctor === "function"
        ? ctor
        : undefined;
}
export function supportsCompression() {
    return (getCompressionStream() !== undefined &&
        typeof Blob !== "undefined" &&
        typeof Response !== "undefined");
}
/** Gzips a UTF-8 string, returning bytes, or null if compression failed. */
export async function gzip(input) {
    const Ctor = getCompressionStream();
    if (!Ctor || typeof Blob === "undefined" || typeof Response === "undefined") {
        return null;
    }
    try {
        const stream = new Blob([input]).stream().pipeThrough(new Ctor("gzip"));
        return await new Response(stream).arrayBuffer();
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=compression.js.map