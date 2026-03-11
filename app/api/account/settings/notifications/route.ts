import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prefs = await prisma.userNotificationPrefs.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });
  return NextResponse.json(prefs);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = prefsSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await prisma.userNotificationPrefs.upsert({
    where: { userId: session.user.id },
    update: body.data,
    create: { userId: session.user.id, ...body.data },
  });
  return NextResponse.json({ success: true });
}
