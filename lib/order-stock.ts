/**
 * Order stock: reserve on create, decrement on payment confirm, restore on cancel.
 * Uses Inventory when present (quantity, reservedQuantity); else Product/ProductVariant.stock.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Tx = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">;

/**
 * Reserve stock for order items (Inventory only). Call inside order-create transaction.
 * Returns false if any item has insufficient (quantity - reservedQuantity).
 */
export async function reserveOrderStock(
  items: { productId: string; variantId?: string | null; quantity: number }[],
  tx?: Tx
): Promise<{ ok: boolean; error?: string }> {
  const db = tx ?? prisma;
  for (const item of items) {
    const inv = await db.inventory.findFirst({
      where: {
        productId: item.productId,
        productVariantId: item.variantId ?? null,
      },
    });
    if (!inv) continue;
    const available = inv.quantity - inv.reservedQuantity;
    if (available < item.quantity) {
      return { ok: false, error: `Insufficient stock for one or more items. Available: ${available}.` };
    }
    await db.inventory.update({
      where: { id: inv.id },
      data: { reservedQuantity: { increment: item.quantity } },
    });
  }
  return { ok: true };
}

/**
 * Decrement stock after payment confirmed. Inventory: decrement quantity and reservedQuantity, create SOLD movement.
 * Product/Variant: decrement stock, create SOLD movement.
 */
export async function decrementOrderStock(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  for (const item of order.items) {
    if (!item.productId) continue;
    const qty = -item.quantity;
    const variantId = item.productVariantId ?? item.variantId ?? null;

    const inv = await prisma.inventory.findFirst({
      where: {
        productId: item.productId,
        productVariantId: variantId,
      },
    });

    if (inv) {
      await prisma.$transaction([
        prisma.inventory.update({
          where: { id: inv.id },
          data: {
            quantity: { decrement: item.quantity },
            reservedQuantity: { decrement: item.quantity },
          },
        }),
        prisma.shopInventoryMovement.create({
          data: {
            productId: item.productId,
            quantity: qty,
            reason: "SOLD",
            reference: order.orderNumber,
          },
        }),
      ]);
    } else {
      if (variantId) {
        await prisma.productVariant.update({
          where: { id: variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await prisma.shopInventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: qty,
          reason: "SOLD",
          reference: order.orderNumber,
        },
      });
    }
  }
}

/**
 * Restore stock on order cancel. Inventory: decrement reservedQuantity only. Product/Variant: increment stock; create RETURN movement.
 */
export async function restoreOrderStock(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  for (const item of order.items) {
    if (!item.productId) continue;
    const variantId = item.productVariantId ?? item.variantId ?? null;

    const inv = await prisma.inventory.findFirst({
      where: {
        productId: item.productId,
        productVariantId: variantId,
      },
    });

    if (inv) {
      await prisma.inventory.update({
        where: { id: inv.id },
        data: { reservedQuantity: { decrement: item.quantity } },
      });
    } else {
      if (variantId) {
        await prisma.productVariant.update({
          where: { id: variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await prisma.shopInventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          reason: "RETURN",
          reference: order.orderNumber,
        },
      });
    }
  }
}
