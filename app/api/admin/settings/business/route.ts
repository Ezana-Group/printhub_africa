import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({
  invoicePrefix: z.string().optional(),
  invoiceNotes: z.string().nullable().optional(),
  invoiceFooter: z.string().nullable().optional(),
  vatOnInvoices: z.boolean().optional(),
  paymentTermsDays: z.number().optional(),
  mpesaEnabled: z.boolean().optional(),
  pesapalEnabled: z.boolean().optional(),
  flutterwaveEnabled: z.boolean().optional(),
  stripeEnabled: z.boolean().optional(),
});

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const s = await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return NextResponse.json(s);
}

export async function PATCH(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const body = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: { ...body.data, updatedAt: new Date() },
    create: { id: "default", ...body.data },
  });
  await writeAudit({ userId: auth.userId, action: "BUSINESS_SETTINGS_UPDATED", category: "SETTINGS", request: req });
  return NextResponse.json({ success: true });
}
