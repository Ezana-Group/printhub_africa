import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import crypto from "crypto";

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

/** POST /api/admin/orders/[id]/payment-link — generate payment link (valid 24h) */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const token = generateSecureToken();
  const expiresAt = addHours(new Date(), 24);

  await prisma.order.update({
    where: { id },
    data: { paymentLinkToken: token, paymentLinkExpiresAt: expiresAt },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "";
  const protocol = baseUrl.startsWith("http") ? "" : "https://";
  const url = `${protocol}${baseUrl}/pay/${id}?token=${token}`;

  return NextResponse.json({ url });
}
