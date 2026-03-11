import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const events = await prisma.orderTrackingEvent.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ events });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : null;
  const location = typeof body.location === "string" ? body.location.trim() : null;
  const courierRef = typeof body.courierRef === "string" ? body.courierRef.trim() : null;
  const isPublic = typeof body.isPublic === "boolean" ? body.isPublic : true;

  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const event = await prisma.orderTrackingEvent.create({
    data: {
      orderId: id,
      status: order.status,
      title,
      description,
      location,
      courierRef,
      isPublic,
      createdBy: auth.session.user?.id ?? undefined,
    },
  });
  return NextResponse.json({ event });
}
