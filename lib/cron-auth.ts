/**
 * Shared cron-job authentication helper.
 *
 * Accepts the secret via the canonical `Authorization: Bearer <CRON_SECRET>`
 * header (Vercel's native cron format) OR the legacy `x-cron-secret` header
 * for backwards-compatibility with external schedulers already configured.
 *
 * BUG-004: Previously each cron route had its own copy of this function.
 * A single source of truth ensures any security change is applied everywhere.
 */

export function checkCronAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // never allow if secret is unset
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = req.headers.get("x-cron-secret");
  return bearer === secret || headerSecret === secret;
}
