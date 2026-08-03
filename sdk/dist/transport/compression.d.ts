/**
 * Optional gzip compression layer using the platform CompressionStream API.
 * Falls back to no compression when unsupported.
 */
export declare function supportsCompression(): boolean;
/** Gzips a UTF-8 string, returning bytes, or null if compression failed. */
export declare function gzip(input: string): Promise<ArrayBuffer | null>;
//# sourceMappingURL=compression.d.ts.map