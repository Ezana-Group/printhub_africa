import { prisma } from "@/lib/prisma";

const KENYA_VAT_RATE = 0.16;

export function generateOrderNumber(): string {
  const random = Math.floor(1000000 + Math.random() * 9000000);
  return `PHUB-${random}`;
}

export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * KENYA_VAT_RATE);
}

export async function ensureUniqueOrderNumber(): Promise<string> {
  let num: string;
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 10) {
    num = generateOrderNumber();
    const found = await prisma.order.findUnique({ where: { orderNumber: num } });
    exists = !!found;
    attempts++;
    if (!exists) return num;
  }
  return generateOrderNumber() + "-" + Date.now();
}
