import { prisma } from "@/lib/prisma";

/**
 * Decrement stock for order items (product and optionally variant).
 * Call when order is confirmed (payment received).
 */
export async function decrementStockForOrder(orderId: string): Promise<void> {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { productId: true, productVariantId: true, quantity: true },
  });
  for (const item of items) {
    if (!item.productId) continue;
    const qty = item.quantity;
    if (item.productVariantId) {
      await prisma.productVariant.update({
        where: { id: item.productVariantId },
        data: { stock: { decrement: qty } },
      });
    }
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: qty } },
    });
  }
}

/**
 * Restore stock for order items (when order cancelled or refunded).
 */
export async function restoreStockForOrder(orderId: string): Promise<void> {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { productId: true, productVariantId: true, quantity: true },
  });
  for (const item of items) {
    if (!item.productId) continue;
    const qty = item.quantity;
    if (item.productVariantId) {
      await prisma.productVariant.update({
        where: { id: item.productVariantId },
        data: { stock: { increment: qty } },
      });
    }
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: qty } },
    });
  }
}
