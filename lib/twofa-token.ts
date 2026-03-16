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
    const expected = createHmac("sha256", getSecret()).update(payloadStr).digest("base64url");
    if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"))) return null;
    return payload.userId;
  } catch {
    return null;
  }
}
