import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({
  businessName: z.string().nullable().optional(),
  tradingName: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  favicon: z.string().nullable().optional(),
  primaryPhone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  primaryEmail: z.string().nullable().optional(),
  supportEmail: z.string().nullable().optional(),
  financeEmail: z.string().nullable().optional(),
  address1: z.string().nullable().optional(),
  address2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  county: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  googleMapsUrl: z.string().nullable().optional(),
  businessHours: z.string().nullable().optional(),
  socialFacebook: z.string().nullable().optional(),
  socialInstagram: z.string().nullable().optional(),
  socialTwitter: z.string().nullable().optional(),
  socialLinkedIn: z.string().nullable().optional(),
  socialTikTok: z.string().nullable().optional(),
  socialYouTube: z.string().nullable().optional(),
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

async function updateBusinessSettings(req: Request) {
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

export async function PATCH(req: Request) {
  return updateBusinessSettings(req);
}

/** Allow POST so older/deployed clients that still send POST get 200 instead of 405. */
export async function POST(req: Request) {
  return updateBusinessSettings(req);
}
