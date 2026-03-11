import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { z } from "zod";

const prefsSchema = z.object({
  emailOrderConfirmed: z.boolean().optional(),
  emailOrderShipped: z.boolean().optional(),
  emailOrderDelivered: z.boolean().optional(),
  emailOrderCancelled: z.boolean().optional(),
  smsOrderConfirmed: z.boolean().optional(),
  smsOrderShipped: z.boolean().optional(),
  whatsappOrderUpdates: z.boolean().optional(),
  emailQuoteReady: z.boolean().optional(),
  emailQuoteExpiring: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
  emailLoyaltyUpdates: z.boolean().optional(),
  emailNewsletterWkly: z.boolean().optional(),
  emailLowStock: z.boolean().optional(),
  emailNewApplication: z.boolean().optional(),
  emailDailyDigest: z.boolean().optional(),
});

export async function GET(req: Request) {
  const auth = await requireRole(req, "STAFF");
  if (auth instanceof NextResponse) return auth;
  const prefs = await prisma.userNotificationPrefs.upsert({
    where: { userId: auth.userId },
    update: {},
    create: { userId: auth.userId },
  });
  return NextResponse.json(prefs);
}

export async function PATCH(req: Request) {
  const auth = await requireRole(req, "STAFF");
  if (auth instanceof NextResponse) return auth;
  const body = prefsSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await prisma.userNotificationPrefs.upsert({
    where: { userId: auth.userId },
    update: body.data,
    create: { userId: auth.userId, ...body.data },
  });
  return NextResponse.json({ success: true });
}
