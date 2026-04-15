import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET ?? "";
const TTL_MS = 5 * 60 * 1000; // 5 minutes

function getSecret(): string {
  if (!SECRET) throw new Error("NEXTAUTH_SECRET is required for 2FA token");
  return SECRET;
}

/** Create a short-lived token for the 2FA step (userId only; no password). */
export function signTwoFaToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + TTL_MS });
  const sig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  const b64 = Buffer.from(payload, "utf8").toString("base64url");
  return `${b64}.${sig}`;
}

/** Verify token and return userId or null. */
export function verifyTwoFaToken(token: string): string | null {
  try {
    const [b64, sig] = token.split(".");
    if (!b64 || !sig) return null;
    const payloadStr = Buffer.from(b64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr);
    if (typeof payload.userId !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    // BUG-007: Compare raw HMAC bytes, not the base64url string representation.
    // Previously Buffer.from(x, "utf8") was used on base64url strings — this worked
    // by accident (base64url is ASCII-safe) but is semantically wrong and fragile.
    // Comparing the raw digest bytes directly is the correct, explicit approach.
    const expectedBuf = createHmac("sha256", getSecret()).update(payloadStr).digest();
    const sigBuf = Buffer.from(sig, "base64url");
    if (expectedBuf.length !== sigBuf.length || !timingSafeEqual(expectedBuf, sigBuf)) return null;
    return payload.userId;
  } catch {
    return null;
  }
}
