import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

/** Coerce string "true"/"false" from form/JSON to boolean; allow real boolean. */
const optionalBoolean = z.union([
  z.boolean(),
  z.string().transform((s) => s === "true" || s === "1"),
]);
/** Coerce string number from form/JSON to number; allow real number. Empty/invalid → undefined. */
const optionalNumber = z.union([
  z.number(),
  z.string().transform((s) => {
    if (s === "" || s == null) return undefined;
    const n = Number(s);
    return Number.isNaN(n) ? undefined : n;
  }),
]);

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
  hoursWeekdays: z.string().nullable().optional(),
  hoursSaturday: z.string().nullable().optional(),
  hoursSunday: z.string().nullable().optional(),
  hoursHolidays: z.string().nullable().optional(),
  socialFacebook: z.string().nullable().optional(),
  socialInstagram: z.string().nullable().optional(),
  socialTwitter: z.string().nullable().optional(),
  socialLinkedIn: z.string().nullable().optional(),
  socialTikTok: z.string().nullable().optional(),
  socialYouTube: z.string().nullable().optional(),
  invoicePrefix: z.string().optional(),
  invoiceNotes: z.string().nullable().optional(),
  invoiceFooter: z.string().nullable().optional(),
  vatOnInvoices: optionalBoolean.optional(),
  paymentTermsDays: optionalNumber.optional(),
  mpesaEnabled: optionalBoolean.optional(),
  pesapalEnabled: optionalBoolean.optional(),
  flutterwaveEnabled: optionalBoolean.optional(),
  stripeEnabled: optionalBoolean.optional(),
  foundingDate: z.string().nullable().optional().transform(v => v ? new Date(v) : null),
  registrationInfo: z.string().nullable().optional(),
  parentCompany: z.string().nullable().optional(),
  supportResponseTime: z.string().nullable().optional(),
  qualityRating: z.string().nullable().optional(),
  qualityChecks: z.string().nullable().optional(),
  materialsInfo: z.string().nullable().optional(),
  warrantyInfo: z.string().nullable().optional(),
  returnPolicyInfo: z.string().nullable().optional(),
  statsOrdersThreshold: optionalNumber.optional(),
  statsClientsThreshold: optionalNumber.optional(),
  showStatsOrders: optionalBoolean.optional(),
  showStatsClients: optionalBoolean.optional(),
  showStatsExperience: optionalBoolean.optional(),
  showStatsMachines: optionalBoolean.optional(),
  showStatsStaff: optionalBoolean.optional(),
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

function stripUndefined<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: T[K] } {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as { [K in keyof T]: T[K] };
}

async function updateBusinessSettings(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const body = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body", details: body.error.flatten() }, { status: 400 });
  const payload = stripUndefined({ ...body.data, updatedAt: new Date() });
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: payload,
    create: { id: "default", ...stripUndefined(body.data ?? {}) },
  });
  revalidateTag("homepage");
  revalidateTag("business");
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
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
