import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const PROVIDER_FIELD_MAP: Record<string, string> = {
  mpesa: "mpesaEnabled",
  pesapal: "pesapalEnabled",
};

const REMOVED_PROVIDERS = ["stripe", "flutterwave"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { provider } = await params;
  if (REMOVED_PROVIDERS.includes(provider.toLowerCase())) {
    return NextResponse.json({ error: "This payment provider is no longer supported. Use M-Pesa or PesaPal." }, { status: 400 });
  }
  const body = z.object({ enabled: z.boolean() }).safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const field = PROVIDER_FIELD_MAP[provider];
  if (!field) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: { [field]: body.data.enabled, updatedAt: new Date() },
    create: { id: "default", [field]: body.data.enabled },
  });
  await writeAudit({
    userId: auth.userId,
    action: `PAYMENT_${provider.toUpperCase()}_${body.data.enabled ? "ENABLED" : "DISABLED"}`,
    category: "SETTINGS",
    request: req,
  });
  return NextResponse.json({ success: true });
}
