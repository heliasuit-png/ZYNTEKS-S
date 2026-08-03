import type { PayloadKind } from "../types";
export declare const ENDPOINT_PATHS: Record<PayloadKind, string>;
/** Resolves the absolute (or same-origin relative) ingestion URL. */
export declare function resolveUrl(base: string, kind: PayloadKind): string;
//# sourceMappingURL=endpoints.d.ts.map