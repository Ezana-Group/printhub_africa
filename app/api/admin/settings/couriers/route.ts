import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET() {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const role = auth.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const couriers = await prisma.courier.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ couriers });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const role = auth.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const trackingUrl = typeof body.trackingUrl === "string" ? body.trackingUrl.trim() || null : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
  const logo = typeof body.logo === "string" ? body.logo.trim() || null : null;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;
  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;
  const address = typeof body.address === "string" ? body.address.trim() || null : null;
  const city = typeof body.city === "string" ? body.city.trim() || null : null;
  const county = typeof body.county === "string" ? body.county.trim() || null : null;

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const courier = await prisma.courier.create({
    data: { name, trackingUrl, phone, logo, isActive, sortOrder, address, city, county },
  });
  return NextResponse.json({ courier });
}
