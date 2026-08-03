interface CryptoLike {
  randomUUID?: () => string;
}

/** Generates a random identifier, preferring the platform's crypto UUID. */
export function uuid(): string {
  const cryptoRef = (globalThis as { crypto?: CryptoLike }).crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random()
    .toString(16)
    .slice(2)}-${Math.random().toString(16).slice(2)}`;
}
