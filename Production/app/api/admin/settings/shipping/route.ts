import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const s = await prisma.shippingSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return NextResponse.json(s);
}

async function updateShipping(req: Request, userId: string) {
  const raw = await req.json().catch(() => ({}));
  const body = z
    .object({
      freeShippingEnabled: z.union([z.boolean(), z.string()]).optional().transform((v) => (v == null ? undefined : v === true || v === "true")),
      freeShippingThresholdKes: z.union([z.number(), z.string()]).optional().transform((v) => (v === "" || v == null ? undefined : Number(v))),
      expressEnabled: z.union([z.boolean(), z.string()]).optional().transform((v) => (v == null ? undefined : v === true || v === "true")),
      clickCollectEnabled: z.union([z.boolean(), z.string()]).optional().transform((v) => (v == null ? undefined : v === true || v === "true")),
    })
    .safeParse(raw);
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await prisma.shippingSettings.upsert({
    where: { id: "default" },
    update: { ...body.data, updatedAt: new Date() },
    create: { id: "default", ...body.data },
  });
  await writeAudit({ userId, action: "SHIPPING_SETTINGS_UPDATED", category: "SETTINGS", request: req });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  return updateShipping(req, auth.userId);
}

export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  return updateShipping(req, auth.userId);
}
