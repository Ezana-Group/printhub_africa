/**
 * Order cancellation rules and refund eligibility.
 */

/** Order statuses that allow customer-initiated cancellation. */
export const CUSTOMER_CANCEL_ALLOWED_STATUSES = ["PENDING", "CONFIRMED"] as const;

/** Order statuses that allow admin-initiated cancellation. */
export const ADMIN_CANCEL_ALLOWED_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
] as const;

/**
 * Whether cancelling this order typically requires a refund (paid orders).
 * Used to prompt admin to create a refund after cancel.
 */
export function requiresRefund(
  order: { status: string; paymentStatus?: string | null; paidAt?: Date | string | null }
): boolean {
  if (order.status === "CANCELLED") return false;
  const paid =
    order.paymentStatus === "CONFIRMED" ||
    order.paidAt != null;
  return paid;
}
