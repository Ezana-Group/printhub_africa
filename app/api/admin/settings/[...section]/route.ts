import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const STAFF_OR_ADMIN = ["STAFF", "ADMIN", "SUPER_ADMIN"];

/** POST: Persist settings for a given section. Writes to DB (PricingConfig key adminSettings:{section}). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ section: string[] }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { section } = await params;
  const firstSegment = section?.[0] ?? "";

  const isMyAccountSection =
    firstSegment === "my-account" || firstSegment === "notifications" || firstSegment === "activity";
  if (isMyAccountSection && !STAFF_OR_ADMIN.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const businessSections = [
    "business",
    "shipping",
    "payments",
    "notifications",
    "integrations",
    "security",
    "system",
  ];
  const marketingSections = ["seo", "loyalty", "referral", "discounts"];
  const superAdminSections = ["users", "audit-log", "danger"];
  if (businessSections.includes(firstSegment) || marketingSections.includes(firstSegment)) {
    if (!ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  if (superAdminSections.includes(firstSegment) && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const key = `adminSettings:${firstSegment}`;
    const valueJson = JSON.stringify(body);
    
    // Standard JSON persistence
    await prisma.pricingConfig.upsert({
      where: { key },
      update: { valueJson },
      create: { key, valueJson },
    });

    // Special handling for System model synchronization
    if (firstSegment === "system") {
      const bFrequency = body.backupFrequencyHours ? parseInt(body.backupFrequencyHours, 10) : 24;
      const existing = await prisma.systemSettings.findFirst();
      if (existing) {
        await prisma.systemSettings.update({
          where: { id: existing.id },
          data: { backupFrequencyHours: bFrequency },
        });
      } else {
        await prisma.systemSettings.create({
          data: { backupFrequencyHours: bFrequency },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Settings save error:", e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/** GET: Return saved settings for a section (for pre-filling forms). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ section: string[] }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { section } = await params;
  const firstSegment = section?.[0] ?? "";
  const key = `adminSettings:${firstSegment}`;
  const row = await prisma.pricingConfig.findUnique({
    where: { key },
  });
  if (!row) return NextResponse.json({});
  try {
    const value = JSON.parse(row.valueJson) as Record<string, unknown>;
    return NextResponse.json(value);
  } catch {
    return NextResponse.json({});
  }
}
