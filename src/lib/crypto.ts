import { createHash, createHmac, randomBytes } from "node:crypto";

/** 256 bits of randomness, URL-safe. Used for sign-in links, sessions and unsubscribe links. */
export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Tokens are long and random, so a plain SHA-256 is enough to make a stolen
 * database useless for signing in. Slow password hashes are for low-entropy input.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Keyed hash for values we must compare but never store, like IP addresses. */
export function keyedHash(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}
