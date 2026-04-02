import { prisma } from "./prisma";

const SANDBOX_BASE = "https://cybqa.pesapal.com/pesapalv3";
const PRODUCTION_BASE = "https://pay.pesapal.com/v3";

export async function getPesapalSettings() {
  const row = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: {
      pesapalEnvironment: true,
      pesapalConsumerKey: true,
      pesapalConsumerSecret: true,
    },
  }).catch(() => null);

  const env = (row?.pesapalEnvironment || process.env.PESAPAL_ENV || "sandbox").toLowerCase();
  const baseUrl = env === "production" || env === "live" ? PRODUCTION_BASE : SANDBOX_BASE;

  return {
    env,
    baseUrl,
    consumerKey: row?.pesapalConsumerKey || process.env.PESAPAL_CONSUMER_KEY,
    consumerSecret: row?.pesapalConsumerSecret || process.env.PESAPAL_CONSUMER_SECRET,
  };
}

export interface PesapalAuthResponse {
  token: string;
  expiryDate?: string;
  status?: string;
  message?: string;
}

/**
 * Get a bearer token (valid ~5 minutes). Call before SubmitOrderRequest.
 */
export async function getPesapalAccessToken(): Promise<string> {
  const settings = await getPesapalSettings();
  const { consumerKey: key, consumerSecret: secret, baseUrl: base } = settings;

  if (!key || !secret) {
    throw new Error("PesaPal Consumer Key and Secret are required");
  }

  const res = await fetch(`${base}/api/Auth/RequestToken`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "PrintHub/1.0 (https://printhub.africa)"
    },
    body: JSON.stringify({
      consumer_key: key,
      consumer_secret: secret,
    }),
  });
  const data = (await res.json()) as PesapalAuthResponse & { error?: number };
  if (!res.ok || data.error || !data.token) {
    throw new Error(data.message ?? `PesaPal auth failed: ${res.status}`);
  }
  return data.token;
}

export interface PesapalBillingAddress {
  phone_number?: string;
  email_address?: string;
  country_code?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  line_1?: string;
  line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  zip_code?: string;
}

export interface PesapalSubmitOrderParams {
  /** Unique merchant reference (e.g. order number). Alphanumeric, dashes, underscores, dots, colons; max 50 chars. */
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  cancellation_url?: string;
  notification_id: string;
  billing_address: PesapalBillingAddress;
  redirect_mode?: "TOP_WINDOW" | "PARENT_WINDOW";
  branch?: string;
}

export interface PesapalSubmitOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: number | null;
  status?: string;
  message?: string;
}

/**
 * Submit an order to PesaPal; returns the redirect_url for the customer to complete payment.
 */
export async function submitPesapalOrder(params: PesapalSubmitOrderParams): Promise<PesapalSubmitOrderResponse> {
  const settings = await getPesapalSettings();
  const token = await getPesapalAccessToken();
  const { baseUrl: base } = settings;
  
  const res = await fetch(`${base}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "PrintHub/1.0 (https://printhub.africa)"
    },
    body: JSON.stringify({
      id: params.id,
      currency: params.currency,
      amount: params.amount,
      description: params.description,
      callback_url: params.callback_url,
      cancellation_url: params.cancellation_url ?? undefined,
      notification_id: params.notification_id,
      redirect_mode: params.redirect_mode ?? "TOP_WINDOW",
      branch: params.branch ?? undefined,
      billing_address: params.billing_address,
    }),
  });
  const data = (await res.json()) as PesapalSubmitOrderResponse;
  if (!res.ok || data.error || !data.redirect_url) {
    throw new Error(data.message ?? `PesaPal submit order failed: ${res.status}`);
  }
  return data;
}

/**
 * Get transaction status (call after IPN to confirm payment).
 * Returns payment_status_description: INVALID | FAILED | COMPLETED | REVERSED; status_code: 0=INVALID, 1=COMPLETED, 2=FAILED, 3=REVERSED.
 */
export async function getPesapalTransactionStatus(orderTrackingId: string): Promise<{
  payment_status_description?: string;
  status_code?: number;
  payment_method?: string;
  amount?: number;
  message?: string;
}> {
  const settings = await getPesapalSettings();
  const token = await getPesapalAccessToken();
  const { baseUrl: base } = settings;
  const url = `${base}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "PrintHub/1.0 (https://printhub.africa)"
    },
  });
  const data = (await res.json()) as {
    payment_status_description?: string;
    status_code?: number;
    payment_method?: string;
    amount?: number;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message ?? `GetTransactionStatus failed: ${res.status}`);
  }
  return data;
}

export async function isPesapalConfigured(): Promise<boolean> {
  const settings = await getPesapalSettings();
  return !!(settings.consumerKey && settings.consumerSecret);
}
