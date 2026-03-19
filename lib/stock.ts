import { decrementOrderStock, restoreOrderStock } from "@/lib/order-stock";

/**
 * Decrement stock for order items when payment is confirmed.
 * Uses Inventory when present (quantity + reservedQuantity), else Product/ProductVariant.
 */
export async function decrementStockForOrder(orderId: string): Promise<void> {
  await decrementOrderStock(orderId);
}

/**
 * Restore stock for order items when order is cancelled.
 * Uses Inventory (release reservedQuantity only) or Product/ProductVariant.
 */
export async function restoreStockForOrder(orderId: string): Promise<void> {
  await restoreOrderStock(orderId);
}
