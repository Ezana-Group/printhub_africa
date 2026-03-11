import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;

  const { id, eventId } = await params;
  const event = await prisma.orderTrackingEvent.findFirst({
    where: { id: eventId, orderId: id },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const body = await req.json();
  const data: { title?: string; description?: string | null; location?: string | null; courierRef?: string | null; isPublic?: boolean } = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (body.description !== undefined) data.description = body.description === null ? null : String(body.description).trim();
  if (body.location !== undefined) data.location = body.location === null ? null : String(body.location).trim();
  if (body.courierRef !== undefined) data.courierRef = body.courierRef === null ? null : String(body.courierRef).trim();
  if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;

  const updated = await prisma.orderTrackingEvent.update({
    where: { id: eventId },
    data,
  });
  return NextResponse.json({ event: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;

  const { id, eventId } = await params;
  const event = await prisma.orderTrackingEvent.findFirst({
    where: { id: eventId, orderId: id },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (!event.createdBy) {
    return NextResponse.json(
      { error: "Cannot delete system-generated event" },
      { status: 400 }
    );
  }

  await prisma.orderTrackingEvent.delete({ where: { id: eventId } });
  return NextResponse.json({ success: true });
}
