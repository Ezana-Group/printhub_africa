/**
 * POST /api/admin/refunds/process-pesapal — process approved refund via PesaPal API
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { processPesapalRefund } from "@/lib/pesapal-refund";
import { sendRefundProcessedEmail } from "@/lib/email";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { withRateLimit } from "@/lib/rate-limit-wrapper";

const bodySchema = z.object({ refundId: z.string() });

async function _POST(req: NextRequest) {
  const auth = await requireAdminApi({ finance: true, needEdit: true });
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const refund = await prisma.refund.findUnique({
    where: { id: parsed.data.refundId },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          payments: { where: { provider: "PESAPAL" }, orderBy: { createdAt: "desc" }, take: 1 },
          user: { select: { email: true } },
        },
      },
    },
  });

  if (!refund) return NextResponse.json({ error: "Refund not found" }, { status: 404 });
  if (refund.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Refund must be approved before PesaPal processing" },
      { status: 400 }
    );
  }
  if (refund.providerRefReference) {
    return NextResponse.json(
      { error: "PesaPal refund already processed for this refund" },
      { status: 400 }
    );
  }

  const payment = refund.order.payments[0];
  if (!payment?.pesapalRef) {
    return NextResponse.json(
      { error: "Order has no PesaPal payment (order tracking ID) for this refund" },
      { status: 400 }
    );
  }

  const amount = Number(refund.amount);
  const reason = refund.reason ?? `Refund ${refund.refundNumber ?? refund.id} Order ${refund.order.orderNumber}`;

  const result = await processPesapalRefund({
    orderTrackingId: payment.pesapalRef,
    amount,
    reason,
    currency: "KES",
  });

  if (!result.success) {
    await prisma.refund.update({
      where: { id: refund.id },
      data: { status: "FAILED" },
    });
    Sentry.captureMessage(`PesaPal refund failed: ${result.error}`, "error");
    return NextResponse.json(
      { error: result.error ?? "PesaPal refund failed" },
      { status: 500 }
    );
  }

  await prisma.$transaction([
    prisma.refund.update({
      where: { id: refund.id },
      data: {
        status: "COMPLETED",
        providerRefReference: result.refundReference ?? undefined,
        processedAt: new Date(),
      },
    }),
    prisma.orderTimeline.create({
      data: {
        orderId: refund.orderId,
        status: "REFUNDED",
        message: `Refund ${refund.refundNumber ?? refund.id} processed via PesaPal. Ref: ${result.refundReference ?? "—"}`,
      },
    }),
  ]);

  const email = refund.order.user?.email;
  if (email) {
    try {
      await sendRefundProcessedEmail(
        email,
        refund.refundNumber ?? refund.id,
        refund.order.orderNumber,
        amount,
        undefined
      );
    } catch (e) {
      console.error("Refund processed email failed:", e);
    }
  }

  return NextResponse.json({
    success: true,
    refundReference: result.refundReference,
  });
}

export const POST = withRateLimit(_POST, { limit: 20, windowMs: 60000, keyPrefix: "admin_refunds", byUserId: true });
