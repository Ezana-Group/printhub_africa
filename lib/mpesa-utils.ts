/**
 * Shared M-Pesa Daraja API utilities used by both STK Push and B2C modules.
 */

export const MPESA_BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

/**
 * Obtain OAuth access token from Safaricom Daraja API.
 */
export async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET required");

  // [M-Pesa] API — updated to use header auth + error handling
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: { 
      Authorization: `Basic ${auth}`,
      "User-Agent": "PrintHub/1.0 (https://printhub.africa)"
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`M-Pesa OAuth failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Format a Kenyan phone number to 254XXXXXXXXX format.
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  return "254" + cleaned;
}
