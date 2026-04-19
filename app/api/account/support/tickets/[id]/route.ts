import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/** GET /api/account/support/tickets/[id] — ticket detail with messages (non-internal only) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          message: true,
          senderType: true,
          createdAt: true,
        },
      },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    messages: ticket.messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

const replySchema = z.object({
  message: z.string().min(1).max(5000),
});

/** POST /api/account/support/tickets/[id] — add reply */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.status === "CLOSED") {
    return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: session.user.id,
        senderType: "CUSTOMER",
        message: parsed.data.message,
        attachments: [],
      },
    }),
    prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() },
    }),
  ]);
  return NextResponse.json({ success: true });
}
