/**
 * PesaPal API v3 refund request.
 * See: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/refund-request
 */
import { getPesapalAccessToken } from "./pesapal";

const SANDBOX_BASE = "https://cybqa.pesapal.com/pesapalv3";
const PRODUCTION_BASE = "https://pay.pesapal.com/v3";

function getBaseUrl(): string {
  const env = (process.env.PESAPAL_ENV ?? "sandbox").toLowerCase();
  return env === "production" || env === "live" ? PRODUCTION_BASE : SANDBOX_BASE;
}

export interface ProcessPesapalRefundParams {
  orderTrackingId: string;
  amount: number;
  reason: string;
  currency?: string;
}

export interface ProcessPesapalRefundResult {
  success: boolean;
  refundReference?: string;
  error?: string;
}

/**
 * Submit a refund request to PesaPal. Returns when the request is accepted;
 * merchant approval may still be required for the refund to complete.
 */
export async function processPesapalRefund(params: ProcessPesapalRefundParams): Promise<ProcessPesapalRefundResult> {
  const { orderTrackingId, amount, reason } = params;
  const username = process.env.ADMIN_EMAIL ?? "merchant";

  try {
    const token = await getPesapalAccessToken();
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/Transactions/RefundRequest`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        confirmation_code: orderTrackingId,
        amount: Number(amount),
        username,
        remarks: reason.slice(0, 200),
      }),
    });

    const data = (await res.json()) as { error?: number; message?: string; refund_ref?: string };
    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.message ?? `PesaPal refund failed: ${res.status}`,
      };
    }

    return {
      success: true,
      refundReference: data.refund_ref ?? orderTrackingId,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "PesaPal refund request failed",
    };
  }
}
