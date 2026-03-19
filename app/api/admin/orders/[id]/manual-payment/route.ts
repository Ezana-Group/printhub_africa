import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { writeAudit } from "@/lib/audit";
import { createInvoiceForOrder } from "@/lib/invoice-create";
import { decrementStockForOrder } from "@/lib/stock";

const schema = z.object({
  method: z.enum(["MPESA_MANUAL", "CASH", "BANK_TRANSFER", "OTHER"]),
  reference: z.string().max(100).optional(),
  amountKes: z.number().positive(),
  notes: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { method, reference, amountKes, notes } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id }, include: { payments: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const userId = (session.user as { id?: string })?.id ?? null;

  await prisma.order.update({
    where: { id },
    data: {
      status: "CONFIRMED",
      paidAt: new Date(),
      manualPaymentRef: reference ?? null,
      manualPaymentNotes: notes ?? null,
      manualPaymentBy: userId,
    },
  });

  await writeAudit({
    userId: userId ?? undefined,
    action: "ORDER_MANUAL_PAYMENT",
    entity: "Order",
    entityId: id,
    details: `Manual payment: ${method}, ref: ${reference ?? "—"}, amount: KSh ${amountKes}`,
    request: req,
  });

  try {
    await createInvoiceForOrder(id);
  } catch (e) {
    console.error("Invoice create on manual-payment:", e);
  }
  try {
    await decrementStockForOrder(id);
  } catch (e) {
    console.error("Stock decrement on manual-payment:", e);
  }

  return NextResponse.json({ success: true });
}
