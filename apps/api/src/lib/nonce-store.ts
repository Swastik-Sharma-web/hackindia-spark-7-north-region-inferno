const nonceStore = new Map<string, number>();

const NONCE_TTL_MS = 10 * 60 * 1000;

export function issueNonce(address: string): string {
  const nonce = crypto.randomUUID();
  nonceStore.set(address.toLowerCase(), Date.now() + NONCE_TTL_MS);
  return nonce;
}

export function consumeNonce(address: string): boolean {
  const key = address.toLowerCase();
  const expiry = nonceStore.get(key);

  if (!expiry) {
    return false;
  }

  nonceStore.delete(key);
  return expiry > Date.now();
}
