import "server-only";

import { logger } from "@/lib/logger";
import type { AiStreamEvent } from "@/services/ai/types";

export type StreamEmitter = (event: AiStreamEvent) => void;

/**
 * Wraps an async handler in a newline-delimited JSON `ReadableStream`. Each
 * emitted event is serialized as one JSON object per line so the client can
 * parse incrementally. Handler errors are surfaced as a single `error` event
 * and never leak internal details.
 */
export function createNdjsonStream(
  run: (emit: StreamEmitter) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit: StreamEmitter = (event) => {
        if (closed) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          closed = true;
        }
      };

      try {
        await run(emit);
      } catch (error) {
        logger.error("AI stream failed", error);
        emit({
          type: "error",
          message: "The assistant is unavailable right now. Please try again.",
        });
      } finally {
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // already closed by cancel
          }
        }
      }
    },
    cancel() {
      // Client disconnected / aborted — stop enqueueing.
    },
  });
}
