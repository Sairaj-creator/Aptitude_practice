/**
 * Secure session cookie helpers using AES-256-GCM encryption.
 * Used for the "Mock Mode" (no Supabase) session path.
 * The SESSION_SECRET must be a 32-byte (256-bit) hex string.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { AuthUser } from "./auth";

const ALGORITHM = "aes-256-gcm";

let devSessionKey: Buffer | null = null;

/**
 * Derive a 32-byte key from the SESSION_SECRET env var.
 * If unset in production (NODE_ENV === "production"), this throws an error immediately (failing closed).
 * If unset in non-production environments, it falls back to a transient, process-lifetime random key.
 *
 * LIMITATION: The dev fallback uses a transient key generated at startup. This works for single-process
 * environments (e.g. next dev) but will fail in multi-instance or serverless deployments (e.g. Vercel)
 * because cold starts or different instances will encrypt/decrypt with different keys, invalidating sessions.
 */
function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set in production");
    }
    if (!devSessionKey) {
      console.warn("[session] SESSION_SECRET not set — generating a transient, random key for this process lifetime.");
      devSessionKey = randomBytes(32);
    }
    return devSessionKey;
  }
  const keyHex = secret.length === 64 ? secret : Buffer.from(secret).toString("hex").padEnd(64, "0").slice(0, 64);
  return Buffer.from(keyHex, "hex");
}

export function encryptSession(user: AuthUser): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(user);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: <iv_hex>.<authTag_hex>.<ciphertext_hex>
  return `${iv.toString("hex")}.${authTag.toString("hex")}.${encrypted.toString("hex")}`;
}

export function decryptSession(token: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const ciphertext = Buffer.from(ciphertextHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8")) as AuthUser;
  } catch {
    return null;
  }
}
