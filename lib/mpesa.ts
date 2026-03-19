/**
 * M-Pesa Daraja API — STK Push (Lipa Na M-Pesa Online)
 * Sandbox: https://sandbox.safaricom.co.ke
 * Production: https://api.safaricom.co.ke
 */

import { MPESA_BASE_URL, getAccessToken, formatPhone } from "@/lib/mpesa-utils";


export interface StkPushResult {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export async function stkPush(
  phone: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<StkPushResult> {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error("MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL required");
  }

  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const formattedPhone = formatPhone(phone);

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  const res = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as StkPushResult & { errorCode?: string; errorMessage?: string };
  if (data.errorCode || !data.CheckoutRequestID) {
    throw new Error(data.errorMessage ?? data.CustomerMessage ?? "STK Push failed");
  }
  return data;
}

export interface StkPushQueryResult {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export async function stkPushQuery(checkoutRequestId: string): Promise<StkPushQueryResult> {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) throw new Error("MPESA_SHORTCODE, MPESA_PASSKEY required");

  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const res = await fetch(`${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as StkPushQueryResult & { errorCode?: string };
  if (data.errorCode) throw new Error(data.ResponseDescription ?? "Query failed");
  return data;
}
