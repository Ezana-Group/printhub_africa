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
  const parsed = z
    .object({
      freeShippingEnabled: z.union([z.boolean(), z.string()]).optional().transform((v) => (v == null ? undefined : v === true || v === "true")),
      freeShippingThreshold: z.union([z.number(), z.string()]).optional().transform((v) => (v === "" || v == null ? undefined : Number(v))),
      freeShippingThresholdKes: z.union([z.number(), z.string()]).optional().transform((v) => (v === "" || v == null ? undefined : Number(v))),
      expressEnabled: z.union([z.boolean(), z.string()]).optional().transform((v) => (v == null ? undefined : v === true || v === "true")),
      clickCollectEnabled: z.union([z.boolean(), z.string()]).optional().transform((v) => (v == null ? undefined : v === true || v === "true")),
    })
    .safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const data = parsed.data;
  const freeShippingThresholdKes = data.freeShippingThresholdKes ?? data.freeShippingThreshold;
  const update = {
    ...(data.freeShippingEnabled !== undefined && { freeShippingEnabled: data.freeShippingEnabled }),
    ...(freeShippingThresholdKes !== undefined && { freeShippingThresholdKes }),
    ...(data.expressEnabled !== undefined && { expressEnabled: data.expressEnabled }),
    ...(data.clickCollectEnabled !== undefined && { clickCollectEnabled: data.clickCollectEnabled }),
    updatedAt: new Date(),
  };
  await prisma.shippingSettings.upsert({
    where: { id: "default" },
    update,
    create: { id: "default", ...update },
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
