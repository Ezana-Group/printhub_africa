/**
 * Shared M-Pesa Daraja API utilities used by both STK Push and B2C modules.
 */

import { prisma } from "./prisma";

export async function getMpesaSettings() {
  const row = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: {
      mpesaEnvironment: true,
      mpesaConsumerKey: true,
      mpesaConsumerSecret: true,
      mpesaShortCode: true,
      mpesaPasskey: true,
    },
  }).catch(() => null);

  const env = row?.mpesaEnvironment || process.env.MPESA_ENV || "sandbox";
  const baseUrl = env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

  return {
    env,
    baseUrl,
    consumerKey: row?.mpesaConsumerKey || process.env.MPESA_CONSUMER_KEY,
    consumerSecret: row?.mpesaConsumerSecret || process.env.MPESA_CONSUMER_SECRET,
    shortCode: row?.mpesaShortCode || process.env.MPESA_SHORTCODE,
    passkey: row?.mpesaPasskey || process.env.MPESA_PASSKEY,
  };
}

/**
 * Obtain OAuth access token from Safaricom Daraja API.
 */
export async function getAccessToken(): Promise<string> {
  const settings = await getMpesaSettings();
  const { consumerKey: key, consumerSecret: secret, baseUrl } = settings;

  if (!key || !secret) throw new Error("M-Pesa Consumer Key and Secret required");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
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
