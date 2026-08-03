import "server-only";

import { createHash, randomBytes } from "node:crypto";

import {
  API_KEY_PREFIX,
  API_KEY_RANDOM_LENGTH,
  API_KEY_VISIBLE_CHARS,
} from "@/lib/constants";
import { buildMaskedKey } from "@/lib/api-key-format";

/**
 * Cryptographic API key utilities.
 *
 * Keys have the format `ZYN-KEY-<32 base62 chars>`. Only the SHA-256 hash of
 * the full key is ever stored; the plaintext is returned once at creation and
 * never persisted. This module is server-only.
 */

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generates a uniformly-distributed random token using rejection sampling to
 * avoid modulo bias.
 */
function randomToken(length: number): string {
  const alphabetLength = ALPHABET.length;
  const maxUnbiasedByte =
    Math.floor(256 / alphabetLength) * alphabetLength;

  let token = "";
  while (token.length < length) {
    const bytes = randomBytes(length);
    for (let i = 0; i < bytes.length && token.length < length; i += 1) {
      const byte = bytes[i];
      if (byte === undefined || byte >= maxUnbiasedByte) {
        continue;
      }
      const char = ALPHABET[byte % alphabetLength];
      if (char !== undefined) {
        token += char;
      }
    }
  }
  return token;
}

/** Computes the SHA-256 hex digest of a full API key. */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export interface GeneratedApiKey {
  /** Full plaintext key. Returned to the caller once and never stored. */
  key: string;
  /** SHA-256 hex digest of {@link key} persisted in the database. */
  hash: string;
  /** Displayable prefix, e.g. `ZYN-KEY-ABCD`. */
  prefix: string;
  /** Masked display value, e.g. `ZYN-KEY-ABCD************************`. */
  masked: string;
}

/** Generates a new cryptographically secure API key and its derived values. */
export function generateApiKey(): GeneratedApiKey {
  const token = randomToken(API_KEY_RANDOM_LENGTH);
  const key = `${API_KEY_PREFIX}${token}`;
  const prefix = `${API_KEY_PREFIX}${token.slice(0, API_KEY_VISIBLE_CHARS)}`;

  return {
    key,
    hash: hashApiKey(key),
    prefix,
    masked: buildMaskedKey(prefix),
  };
}
