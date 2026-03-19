import { prisma } from "@/lib/prisma";

const PRINT_ORDER_TYPES = ["LARGE_FORMAT", "THREE_D_PRINT", "CUSTOM_PRINT", "POD"] as const;

/**
 * Add order items to the production queue when the order is a print order and payment is confirmed.
 * Call after order status is set to CONFIRMED (e.g. after confirm-payment or M-Pesa callback).
 */
export async function addOrderToProductionQueue(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { type: true },
  });
  if (!order || !PRINT_ORDER_TYPES.includes(order.type as (typeof PRINT_ORDER_TYPES)[number])) {
    return;
  }

  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { id: true },
  });
  const existing = await prisma.productionQueue.findMany({
    where: { orderId },
    select: { orderItemId: true },
  });
  const existingSet = new Set(existing.map((e) => e.orderItemId));
  const toCreate = items.filter((i) => !existingSet.has(i.id));
  if (toCreate.length === 0) return;

  await prisma.productionQueue.createMany({
    data: toCreate.map((item) => ({
      orderId,
      orderItemId: item.id,
      status: "Queued",
    })),
  });
}
