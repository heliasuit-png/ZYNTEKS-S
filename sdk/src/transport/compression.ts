/**
 * Optional gzip compression layer using the platform CompressionStream API.
 * Falls back to no compression when unsupported.
 */

type CompressionStreamCtor = new (
  format: string,
) => TransformStream<Uint8Array, Uint8Array>;

function getCompressionStream(): CompressionStreamCtor | undefined {
  const ctor = (globalThis as { CompressionStream?: unknown }).CompressionStream;
  return typeof ctor === "function"
    ? (ctor as CompressionStreamCtor)
    : undefined;
}

export function supportsCompression(): boolean {
  return (
    getCompressionStream() !== undefined &&
    typeof Blob !== "undefined" &&
    typeof Response !== "undefined"
  );
}

/** Gzips a UTF-8 string, returning bytes, or null if compression failed. */
export async function gzip(input: string): Promise<ArrayBuffer | null> {
  const Ctor = getCompressionStream();
  if (!Ctor || typeof Blob === "undefined" || typeof Response === "undefined") {
    return null;
  }
  try {
    const stream = new Blob([input]).stream().pipeThrough(new Ctor("gzip"));
    return await new Response(stream).arrayBuffer();
  } catch {
    return null;
  }
}
