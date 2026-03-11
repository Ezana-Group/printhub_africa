/**
 * Single source of truth for cart and checkout totals.
 * Prices in DB are VAT-INCLUSIVE (e.g. KES 450 already includes 16% VAT).
 * Used by both cart page and checkout — same numbers everywhere.
 */

const VAT_RATE = 0.16;

export interface CartItemForTotals {
  unitPrice: number;
  quantity: number;
}

export function calculateCartTotals(
  items: CartItemForTotals[],
  shippingFee: number = 0,
  discountKes: number = 0
) {
  // Prices are VAT-inclusive
  const subtotalInclVat = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Extract VAT from inclusive price: VAT = total × (rate / (100 + rate))
  const vatAmount = subtotalInclVat * (VAT_RATE / (1 + VAT_RATE));
  const subtotalExclVat = subtotalInclVat - vatAmount;

  const discountedSubtotal = Math.max(0, subtotalInclVat - discountKes);
  const total = discountedSubtotal + shippingFee;

  return {
    subtotalInclVat: Math.round(subtotalInclVat),
    subtotalExclVat: Math.round(subtotalExclVat),
    vatAmount: Math.round(vatAmount),
    shippingFee,
    discountKes,
    total: Math.round(total),
    vatNote: "Prices include 16% VAT",
  };
}
