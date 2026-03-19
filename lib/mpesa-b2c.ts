/**
 * M-Pesa B2C (Business to Customer) — send money to customer (e.g. refunds).
 * Sandbox: https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest
 * Production: https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest
 */

import { MPESA_BASE_URL, getAccessToken, formatPhone } from "@/lib/mpesa-utils";


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

  const res = await fetch(`${MPESA_BASE_URL}/mpesa/b2c/v1/paymentrequest`, {
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
