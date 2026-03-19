/**
 * POST /api/admin/refunds/[id]/process-b2c — send refund to customer via M-Pesa B2C
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { b2cPaymentRequest } from "@/lib/mpesa-b2c";
import { z } from "zod";

const bodySchema = z.object({
  mpesaPhone: z.string().min(9).max(20),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ finance: true, needEdit: true });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const refund = await prisma.refund.findUnique({
    where: { id },
    include: { order: { select: { orderNumber: true } } },
  });
  if (!refund) return NextResponse.json({ error: "Refund not found" }, { status: 404 });
  if (refund.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Refund must be approved before B2C payout" },
      { status: 400 }
    );
  }
  if (refund.mpesaConversationId) {
    return NextResponse.json(
      { error: "B2C already initiated for this refund" },
      { status: 400 }
    );
  }

  const amount = Number(refund.amount);
  const remarks = `Refund ${refund.refundNumber ?? refund.id} Order ${refund.order.orderNumber}`;
  try {
    const result = await b2cPaymentRequest(
      parsed.data.mpesaPhone,
      amount,
      remarks,
      "Refund"
    );
    await prisma.refund.update({
      where: { id },
      data: {
        mpesaPhone: parsed.data.mpesaPhone,
        mpesaConversationId: result.ConversationID,
      },
    });
    return NextResponse.json({
      success: true,
      conversationId: result.ConversationID,
      description: result.ResponseDescription,
    });
  } catch (e) {
    console.error("B2C request error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "B2C payment request failed" },
      { status: 502 }
    );
  }
}
