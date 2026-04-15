/**
 * n8n internal API authentication helper.
 *
 * n8n workflows call back into the Next.js app via internal HTTP endpoints.
 * They identify themselves with the `N8N_WEBHOOK_SECRET` env var sent in one
 * of two headers (workflows use different names — we accept both):
 *
 *   - x-printhub-signature  (most workflows)
 *   - x-n8n-secret          (older/alternate workflows)
 *
 * Comparison is always timing-safe to prevent timing attacks.
 */
import { timingSafeEqual } from "crypto";

export function validateN8nSecret(req: Request): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return false;

  const sig =
    req.headers.get("x-printhub-signature") ??
    req.headers.get("x-n8n-secret");

  if (!sig) return false;

  try {
    const secretBuf = Buffer.from(secret, "utf8");
    const sigBuf = Buffer.from(sig, "utf8");
    // timingSafeEqual requires equal-length buffers
    if (secretBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(secretBuf, sigBuf);
  } catch {
    return false;
  }
}

export function n8nUnauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
