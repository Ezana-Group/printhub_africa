import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

type WeekWindow = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const diff = day === 0 ? -6 : 1 - day; // move to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function weekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "staff_view" });
  if (auth instanceof NextResponse) return auth;

  const { id: userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, staff: { select: { id: true } } },
  });
  if (!user || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
  }

  const now = new Date();
  const thisWeekStart = startOfWeekMonday(now);
  const weeks: WeekWindow[] = [];
  for (let i = 3; i >= 0; i -= 1) {
    const start = addDays(thisWeekStart, -7 * i);
    const end = addDays(start, 7);
    weeks.push({
      key: weekKey(start),
      label: `Week ${4 - i}`,
      start,
      end,
    });
  }

  const rangeStart = weeks[0].start;
  const rangeEnd = weeks[weeks.length - 1].end;

  const [orderEvents, quotes, staffMessages] = await Promise.all([
    prisma.orderTrackingEvent.findMany({
      where: {
        createdBy: userId,
        createdAt: { gte: rangeStart, lt: rangeEnd },
      },
      select: { createdAt: true },
    }),
    user.staff
      ? prisma.quote.findMany({
          where: {
            assignedStaffId: user.staff.id,
            updatedAt: { gte: rangeStart, lt: rangeEnd },
          },
          select: { updatedAt: true },
        })
      : Promise.resolve([]),
    prisma.ticketMessage.findMany({
      where: {
        senderId: userId,
        senderType: "STAFF",
        createdAt: { gte: rangeStart, lt: rangeEnd },
      },
      orderBy: { createdAt: "asc" },
      select: {
        ticketId: true,
        createdAt: true,
        ticket: { select: { createdAt: true } },
      },
    }),
  ]);

  const orderCountByWeek = new Map<string, number>();
  for (const row of orderEvents) {
    const key = weekKey(startOfWeekMonday(row.createdAt));
    orderCountByWeek.set(key, (orderCountByWeek.get(key) ?? 0) + 1);
  }

  const quoteCountByWeek = new Map<string, number>();
  for (const row of quotes) {
    const key = weekKey(startOfWeekMonday(row.updatedAt));
    quoteCountByWeek.set(key, (quoteCountByWeek.get(key) ?? 0) + 1);
  }

  const firstStaffResponseByTicket = new Map<
    string,
    { firstResponseAt: Date; ticketCreatedAt: Date }
  >();
  for (const msg of staffMessages) {
    if (!firstStaffResponseByTicket.has(msg.ticketId)) {
      firstStaffResponseByTicket.set(msg.ticketId, {
        firstResponseAt: msg.createdAt,
        ticketCreatedAt: msg.ticket.createdAt,
      });
    }
  }

  const responseHours: number[] = [];
  for (const row of firstStaffResponseByTicket.values()) {
    const deltaMs = row.firstResponseAt.getTime() - row.ticketCreatedAt.getTime();
    if (deltaMs >= 0) responseHours.push(deltaMs / (1000 * 60 * 60));
  }

  const avgResponseHours =
    responseHours.length > 0
      ? responseHours.reduce((sum, n) => sum + n, 0) / responseHours.length
      : null;

  const chart = weeks.map((w) => ({
    week: w.label,
    orders: orderCountByWeek.get(w.key) ?? 0,
    quotes: quoteCountByWeek.get(w.key) ?? 0,
  }));

  return NextResponse.json({
    summary: {
      ordersProcessed: orderEvents.length,
      quotesHandled: quotes.length,
      avgResponseHours,
      ticketsResponded: firstStaffResponseByTicket.size,
    },
    chart,
    range: {
      from: rangeStart.toISOString(),
      to: rangeEnd.toISOString(),
    },
  });
}

