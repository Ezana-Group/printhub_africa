/**
 * M-Pesa B2C (Business to Customer) — send money to customer (e.g. refunds).
 * Sandbox: https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest
 * Production: https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest
 */

const BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET required");
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`M-Pesa OAuth failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  return "254" + cleaned;
}

export interface B2CResult {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

/**
 * Request B2C payment (e.g. refund to customer phone).
 * Env: MPESA_B2C_INITIATOR_NAME, MPESA_B2C_SECURITY_CREDENTIAL (base64-encoded initiator password),
 * MPESA_SHORTCODE (PartyA), MPESA_B2C_RESULT_URL, MPESA_B2C_QUEUE_TIMEOUT_URL.
 */
export async function b2cPaymentRequest(
  phone: string,
  amount: number,
  remarks: string,
  occasion?: string
): Promise<B2CResult> {
  const initiatorName = process.env.MPESA_B2C_INITIATOR_NAME;
  const securityCredential = process.env.MPESA_B2C_SECURITY_CREDENTIAL;
  const shortcode = process.env.MPESA_SHORTCODE;
  const resultUrl = process.env.MPESA_B2C_RESULT_URL;
  const queueTimeoutUrl = process.env.MPESA_B2C_QUEUE_TIMEOUT_URL;

  if (!initiatorName || !securityCredential || !shortcode || !resultUrl || !queueTimeoutUrl) {
    throw new Error(
      "MPESA_B2C_INITIATOR_NAME, MPESA_B2C_SECURITY_CREDENTIAL, MPESA_SHORTCODE, MPESA_B2C_RESULT_URL, MPESA_B2C_QUEUE_TIMEOUT_URL required"
    );
  }

  const token = await getAccessToken();
  const partyB = formatPhone(phone);
  const body = {
    InitiatorName: initiatorName,
    SecurityCredential: securityCredential,
    CommandID: "BusinessPayment",
    Amount: Math.round(amount),
    PartyA: shortcode,
    PartyB: partyB,
    Remarks: remarks.slice(0, 100),
    QueueTimeOutURL: queueTimeoutUrl,
    ResultURL: resultUrl,
    Occasion: (occasion ?? "Refund").slice(0, 100),
  };

  const res = await fetch(`${BASE_URL}/mpesa/b2c/v1/paymentrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as B2CResult & { errorCode?: string; errorMessage?: string };
  if (data.errorCode || !data.ConversationID) {
    throw new Error(data.errorMessage ?? data.ResponseDescription ?? "B2C request failed");
  }
  return data;
}
