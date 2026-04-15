/**
 * Shared IP check for M-Pesa callbacks (STK and B2C).
 * In production (MPESA_ENV=production), MPESA_CALLBACK_IP_WHITELIST must be set.
 * Use MPESA_B2C_CALLBACK_IP_WHITELIST for B2C if different from STK; otherwise falls back to MPESA_CALLBACK_IP_WHITELIST.
 *
 * SECURITY: IPs are matched with exact string equality only.
 * Do NOT use prefix/startsWith matching — "196.201.214" would match
 * "196.201.214.1" AND a spoofed "196.201.214xxx.attacker.com" if truncated.
 * Populate the whitelist with full IPv4 addresses as published by Safaricom:
 *   196.201.214.200, 196.201.214.206, 196.201.214.207, 196.201.214.208,
 *   196.201.214.209, 196.201.214.210, 196.201.214.211, 196.201.214.212
 */
export type CallbackIpCheckResult =
  | { allowed: true }
  | { allowed: false; productionRequiresWhitelist?: boolean };

export function getMpesaCallbackIpCheck(
  req: Request,
  options?: { useB2CWhitelist?: boolean }
): CallbackIpCheckResult {
  const env = process.env.MPESA_ENV?.toLowerCase();
  const isProduction = env === "production";
  const whitelistVar = options?.useB2CWhitelist
    ? process.env.MPESA_B2C_CALLBACK_IP_WHITELIST ?? process.env.MPESA_CALLBACK_IP_WHITELIST
    : process.env.MPESA_CALLBACK_IP_WHITELIST;
  const whitelist = whitelistVar?.trim();
  const ips = whitelist ? whitelist.split(",").map((s) => s.trim()).filter(Boolean) : [];

  if (isProduction && ips.length === 0) {
    return { allowed: false, productionRequiresWhitelist: true };
  }
  if (ips.length === 0) return { allowed: true };

  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0]?.trim() : req.headers.get("x-real-ip") ?? null;
  if (!clientIp) return { allowed: false };

  // CRIT-003 fix: exact match only — no startsWith / prefix matching
  return { allowed: ips.some((ip) => clientIp === ip) };
}
