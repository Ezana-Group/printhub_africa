import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const HISTORY_KEY = "3dPrintHistory";
const MAX_HISTORY = 500;

type HistoryEntry = {
  id: string;
  staffUserId: string | null;
  jobName: string;
  materialCode: string;
  weightGrams: number;
  printTimeHours: number;
  quantity: number;
  postProcessing: boolean;
  productionCost: number;
  sellingPrice: number;
  profitAmount: number;
  marginPercent: number;
  createdAt: string;
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const config = await prisma.pricingConfig.findUnique({
      where: { key: HISTORY_KEY },
    });
    const list: HistoryEntry[] = config?.valueJson
      ? JSON.parse(config.valueJson)
      : [];
    const { searchParams } = new URL(req.url);
    const material = searchParams.get("material");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");
    let filtered = list;
    if (material) filtered = filtered.filter((e) => e.materialCode === material);
    if (from) filtered = filtered.filter((e) => e.createdAt >= from);
    if (to) filtered = filtered.filter((e) => e.createdAt <= to);
    if (search)
      filtered = filtered.filter((e) =>
        e.jobName.toLowerCase().includes(search.toLowerCase())
      );
    return NextResponse.json(filtered.reverse());
  } catch (e) {
    console.error("3D history GET error:", e);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const entry: HistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      staffUserId: session.user?.id ?? null,
      jobName: String(body.jobName ?? "Unnamed job"),
      materialCode: String(body.materialCode ?? ""),
      weightGrams: Number(body.weightGrams) || 0,
      printTimeHours: Number(body.printTimeHours) || 0,
      quantity: Number(body.quantity) || 1,
      postProcessing: Boolean(body.postProcessing),
      productionCost: Number(body.productionCost) || 0,
      sellingPrice: Number(body.sellingPrice) || 0,
      profitAmount: Number(body.profitAmount) || 0,
      marginPercent: Number(body.marginPercent) || 0,
      createdAt: new Date().toISOString(),
    };
    const config = await prisma.pricingConfig.findUnique({
      where: { key: HISTORY_KEY },
    });
    const list: HistoryEntry[] = config?.valueJson
      ? JSON.parse(config.valueJson)
      : [];
    list.unshift(entry);
    const trimmed = list.slice(0, MAX_HISTORY);
    await prisma.pricingConfig.upsert({
      where: { key: HISTORY_KEY },
      create: { key: HISTORY_KEY, valueJson: JSON.stringify(trimmed) },
      update: { valueJson: JSON.stringify(trimmed) },
    });
    return NextResponse.json({ ok: true, id: entry.id });
  } catch (e) {
    console.error("3D history POST error:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
