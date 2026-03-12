import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const role = auth.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const data: {
    name?: string;
    trackingUrl?: string | null;
    phone?: string | null;
    logo?: string | null;
    isActive?: boolean;
    sortOrder?: number;
    address?: string | null;
    city?: string | null;
    county?: string | null;
  } = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (body.trackingUrl !== undefined) data.trackingUrl = body.trackingUrl === null ? null : String(body.trackingUrl).trim();
  if (body.phone !== undefined) data.phone = body.phone === null ? null : String(body.phone).trim();
  if (body.logo !== undefined) data.logo = body.logo === null ? null : String(body.logo).trim();
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
  if (body.address !== undefined) data.address = body.address === null ? null : String(body.address).trim();
  if (body.city !== undefined) data.city = body.city === null ? null : String(body.city).trim();
  if (body.county !== undefined) data.county = body.county === null ? null : String(body.county).trim();

  const courier = await prisma.courier.update({
    where: { id },
    data,
  });
  return NextResponse.json({ courier });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const role = auth.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.courier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
