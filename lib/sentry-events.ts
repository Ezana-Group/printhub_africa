import * as Sentry from "@sentry/nextjs";

export function capturePaymentFailure(params: {
  orderId: string;
  orderNumber: string;
  amount: number;
  phone: string;
  reason: string;
}) {
  Sentry.captureMessage("Payment failed", {
    level: "error",
    tags: {
      event_type: "payment_failure",
      payment_method: "mpesa",
    },
    extra: params,
  });
}

export function capturePaymentSuccess(params: {
  orderId: string;
  orderNumber: string;
  amount: number;
  mpesaRef: string;
}) {
  Sentry.captureMessage("Payment successful", {
    level: "info",
    tags: { event_type: "payment_success" },
    extra: params,
  });
}

export function captureUploadFailure(params: {
  context: string;
  filename: string;
  error: string;
  userId?: string;
}) {
  Sentry.captureMessage("File upload failed", {
    level: "warning",
    tags: { event_type: "upload_failure" },
    extra: params,
  });
}

export function captureQuoteFailure(params: {
  quoteType: string;
  error: string;
  email?: string;
}) {
  Sentry.captureMessage("Quote submission failed", {
    level: "error",
    tags: { event_type: "quote_failure" },
    extra: params,
  });
}

export function captureAdminActionFailure(params: {
  action: string;
  itemId: string;
  error: string;
  adminId: string;
}) {
  Sentry.captureMessage(`Admin action failed: ${params.action}`, {
    level: "warning",
    tags: { event_type: "admin_failure" },
    extra: params,
  });
}
