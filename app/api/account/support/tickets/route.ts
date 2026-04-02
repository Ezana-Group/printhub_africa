import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { getNextTicketNumber } from "@/lib/next-invoice-number";
import { sendTicketCreatedEmail } from "@/lib/email";
import { z } from "zod";

const createSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
  orderId: z.string().optional(),
});

/** GET /api/account/support/tickets — list tickets for logged-in user */
export async function GET() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(
    tickets.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
  );
}

/** POST /api/account/support/tickets — create ticket (logged-in user) */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { subject, message, orderId } = parsed.data;
  const ticketNumber = await getNextTicketNumber();
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      userId: session.user.id,
      subject,
      status: "OPEN",
      priority: "MEDIUM",
      orderId: orderId ?? undefined,
      messages: {
        create: {
          senderId: session.user.id,
          senderType: "CUSTOMER",
          message,
          attachments: [],
        },
      },
    },
    select: { id: true, ticketNumber: true, subject: true, status: true, createdAt: true },
  });
  const userEmail = (session.user?.email as string) ?? "";
  if (userEmail) {
    try {
      await sendTicketCreatedEmail(userEmail, ticket.ticketNumber, ticket.subject);
    } catch (e) {
      console.error("Ticket created email error:", e);
    }
  }
  return NextResponse.json({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
  });
}
