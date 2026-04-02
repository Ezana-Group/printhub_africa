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
      resendApiKey: true,
      emailFromName: true,
      emailFrom: true,
      emailReplyTo: true,
      atApiKey: true,
      atUsername: true,
      atSenderId: true,
      whatsappNumber: true,
      whatsappPrefilledMessage: true,
      whatsappFloatingButton: true,
      adminAlertEmail: true,
      adminAlertEvents: true,
    },
  });

  // Mask API keys for frontend
  const response = {
    ...s,
    resendApiKey: s.resendApiKey ? "••••••••••••••••" : null,
    atApiKey: s.atApiKey ? "••••••••••••••••" : null,
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
    emailFromName: body.emailFromName,
    emailFrom: body.emailFrom,
    emailReplyTo: body.emailReplyTo,
    atUsername: body.atUsername,
    atSenderId: body.atSenderId,
    whatsappNumber: body.whatsappNumber,
    whatsappPrefilledMessage: body.whatsappPrefilledMessage,
    whatsappFloatingButton: body.whatsappFloatingButton === true || body.whatsappFloatingButton === "true",
    adminAlertEmail: body.adminAlertEmail,
  };

  if (body.resendApiKey && body.resendApiKey !== "••••••••••••••••") {
    data.resendApiKey = body.resendApiKey;
  }
  if (body.atApiKey && body.atApiKey !== "••••••••••••••••") {
    data.atApiKey = body.atApiKey;
  }

  const updated = await prisma.businessSettings.update({
    where: { id: "default" },
    data,
  });

  await writeAudit({
    userId: auth.userId,
    action: "NOTIFICATION_SETTINGS_UPDATED",
    entity: "BUSINESS_SETTINGS",
    entityId: "default",
    request: req,
    before: oldSettings,
    after: updated,
  });

  return NextResponse.json({ success: true });
}
