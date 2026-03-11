import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PRINTER_SETTINGS,
  type PrinterSettings,
} from "@/lib/3d-calculator-engine";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const SETTINGS_KEY = "3dPrinterSettings";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const config = await prisma.pricingConfig.findUnique({
      where: { key: SETTINGS_KEY },
    });
    const settings: PrinterSettings = config?.valueJson
      ? { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(config.valueJson) }
      : DEFAULT_PRINTER_SETTINGS;
    return NextResponse.json(settings);
  } catch (e) {
    console.error("3D settings GET error:", e);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const config = await prisma.pricingConfig.findUnique({
      where: { key: SETTINGS_KEY },
    });
    const current: PrinterSettings = config?.valueJson
      ? { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(config.valueJson) }
      : DEFAULT_PRINTER_SETTINGS;
    const updated: PrinterSettings = {
      ...current,
      ...body,
    };
    await prisma.pricingConfig.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, valueJson: JSON.stringify(updated) },
      update: { valueJson: JSON.stringify(updated) },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("3D settings PATCH error:", e);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
