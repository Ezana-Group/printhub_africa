/**
 * M-Pesa Daraja API health check (token fetch).
 * Use before STK push to fail fast if Daraja is down.
 */

const BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export interface MpesaHealthResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

export async function checkMpesaHealth(): Promise<MpesaHealthResult> {
  const start = Date.now();
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) {
    return { ok: false, error: "M-Pesa credentials not configured" };
  }
  try {
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");
    // [M-Pesa] API — updated to use header auth + error handling
    const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: { 
        Authorization: `Basic ${auth}`,
        "User-Agent": "PrintHub/1.0 (https://printhub.africa)"
      },
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, latencyMs, error: `Daraja OAuth ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true, latencyMs };
  } catch (e) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: e instanceof Error ? e.message : "M-Pesa unreachable",
    };
  }
}
