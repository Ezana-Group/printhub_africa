import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const s = await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
    select: {
      mpesaEnvironment: true,
      mpesaShortCode: true,
      mpesaPasskey: true,
      mpesaConsumerKey: true,
      mpesaConsumerSecret: true,
      mpesaPaybillNumber: true,
      mpesaTillNumber: true,
      pesapalConsumerKey: true,
      pesapalConsumerSecret: true,
      pesapalEnvironment: true,
      bankTransferEnabled: true,
      bankTransferThreshold: true,
      bankTransferDetails: true,
      guestCheckoutEnabled: true,
      minimumOrderValue: true,
      paymentTimeoutMinutes: true,
      quotePrefix: true,
      invoiceDueDays: true,
    },
  });

  // Mask API keys
  const response = {
    ...s,
    mpesaPasskey: s.mpesaPasskey ? "••••••••••••••••" : null,
    mpesaConsumerKey: s.mpesaConsumerKey ? "••••••••••••••••" : null,
    mpesaConsumerSecret: s.mpesaConsumerSecret ? "••••••••••••••••" : null,
    pesapalConsumerKey: s.pesapalConsumerKey ? "••••••••••••••••" : null,
    pesapalConsumerSecret: s.pesapalConsumerSecret ? "••••••••••••••••" : null,
  };

  return NextResponse.json(response);
}

export async function POST(req: Request) {
  return PATCH(req);
}

export async function PATCH(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  
  const oldSettings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  });

  const data: any = {
    mpesaEnvironment: body.mpesaEnvironment,
    mpesaShortCode: body.mpesaShortCode,
    mpesaPaybillNumber: body.mpesaPaybillNumber,
    mpesaTillNumber: body.mpesaTillNumber,
    pesapalEnvironment: body.pesapalEnvironment,
    bankTransferEnabled: body.bankTransferEnabled,
    bankTransferThreshold: body.bankTransferThreshold,
    bankTransferDetails: body.bankTransferDetails,
    guestCheckoutEnabled: body.guestCheckoutEnabled,
    minimumOrderValue: body.minimumOrderValue,
    paymentTimeoutMinutes: body.paymentTimeoutMinutes,
    quotePrefix: body.quotePrefix,
    invoiceDueDays: body.invoiceDueDays,
  };

  // Only update if not masked
  if (body.mpesaPasskey && body.mpesaPasskey !== "••••••••••••••••") {
    data.mpesaPasskey = body.mpesaPasskey;
  }
  if (body.mpesaConsumerKey && body.mpesaConsumerKey !== "••••••••••••••••") {
    data.mpesaConsumerKey = body.mpesaConsumerKey;
  }
  if (body.mpesaConsumerSecret && body.mpesaConsumerSecret !== "••••••••••••••••") {
    data.mpesaConsumerSecret = body.mpesaConsumerSecret;
  }
  if (body.pesapalConsumerKey && body.pesapalConsumerKey !== "••••••••••••••••") {
    data.pesapalConsumerKey = body.pesapalConsumerKey;
  }
  if (body.pesapalConsumerSecret && body.pesapalConsumerSecret !== "••••••••••••••••") {
    data.pesapalConsumerSecret = body.pesapalConsumerSecret;
  }

  const updated = await prisma.businessSettings.update({
    where: { id: "default" },
    data,
  });

  await writeAudit({
    userId: auth.userId,
    action: "PAYMENT_SETTINGS_UPDATED",
    category: "SETTINGS",
    request: req,
    before: oldSettings,
    after: updated,
  });

  return NextResponse.json({ success: true });
}
